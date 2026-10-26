import { describe, expect, it } from 'vitest';

import {
  bashRefusal,
  nextVersion,
  resultOutcome,
  validatePayload,
  verifyNotes,
} from '../../scripts/release-notes.mjs';

/**
 * The plain-code fence around the release-notes agent (`scripts/release-notes.mjs`). Pure functions only: no
 * git, no file system, no live run. The range below is made up: three commits after v0.1.0.
 */

const COMMITS = [
  { sha: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678', subject: 'feat(lobby): create player' },
  { sha: 'b2c3d4e5f60718293a4b5c6d7e8f901234567890', subject: 'fix(lobby): reject empty player names' },
  { sha: 'c3d4e5f60718293a4b5c6d7e8f90123456789012', subject: 'ci: run pnpm check on pull requests' },
];
const RANGE = { range: 'v0.1.0..HEAD', commits: COMMITS };

const PAYLOAD = {
  version: '0.2.0',
  previous: 'v0.1.0',
  entries: [
    { type: 'added', summary: 'Players can join the lobby by name', commits: ['a1b2c3d'] },
    { type: 'fixed', summary: 'An empty player name is rejected', commits: ['b2c3d4e'] },
    { type: 'internal', summary: 'CI runs the full check on every pull request', commits: ['c3d4e5f'] },
  ],
};

const CHANGELOG = `# Changelog

## Unreleased

## [0.2.0] - 2026-10-26

### Added

- Players can join the lobby by name (a1b2c3d)

### Fixed

- An empty player name is rejected (b2c3d4e)

### Internal

- CI runs the full check on every pull request (c3d4e5f)

## [0.1.0] - 2026-10-01

### Added

- Project skeleton
`;

const FACTS = { version: '0.2.0', previous: 'v0.1.0', date: '2026-10-26', commits: COMMITS, changelog: CHANGELOG };

const withEntries = (entries: unknown[]) => ({ ...PAYLOAD, entries });

describe('nextVersion', () => {
  it('bumps the minor when any commit is a feat', () => {
    expect(nextVersion('v0.1.0', ['fix: a', 'feat(lobby): b'])).toBe('0.2.0');
    expect(nextVersion('v1.4.2', ['feat!: drop the old api'])).toBe('1.5.0');
    expect(nextVersion('v0.1.3', ['feat: c'])).toBe('0.2.0');
  });

  it('bumps the patch otherwise', () => {
    expect(nextVersion('v0.1.0', ['fix(bank): a', 'chore: b', 'ci: c'])).toBe('0.1.1');
    expect(nextVersion('v0.1.0', ['feature: not a conventional feat'])).toBe('0.1.1');
  });

  it('gives up on a tag that is not vX.Y.Z', () => {
    expect(nextVersion('v0.1', ['fix: a'])).toBeNull();
    expect(nextVersion('vnext', ['fix: a'])).toBeNull();
  });
});

describe('bashRefusal', () => {
  it("admits the range's git log, quoted or not", () => {
    expect(bashRefusal("git log --no-merges --format='%h %s' v0.1.0..HEAD", RANGE)).toBeNull();
    expect(bashRefusal('git log --no-merges --format="%h %s"   v0.1.0..HEAD', RANGE)).toBeNull();
  });

  it('admits git show --stat of commits in the range, short or full', () => {
    expect(bashRefusal('git show --stat a1b2c3d', RANGE)).toBeNull();
    expect(bashRefusal(`git show --stat a1b2c3d ${COMMITS[2]?.sha}`, RANGE)).toBeNull();
  });

  it('refuses any other git log', () => {
    expect(bashRefusal("git log --no-merges --format='%h %s' v0.0.1..HEAD", RANGE)).toMatch(/only/);
    expect(bashRefusal('git log -p v0.1.0..HEAD', RANGE)).toMatch(/only/);
    expect(bashRefusal("git log --no-merges --format='%h %s' v0.1.0..HEAD --output=x", RANGE)).toMatch(/only/);
  });

  it('refuses git show of other commits, blobs or with more after it', () => {
    expect(bashRefusal('git show --stat d4e5f60', RANGE)).toMatch(/only/);
    expect(bashRefusal('git show --stat a1b2c3d:.env', RANGE)).toMatch(/only/);
    expect(bashRefusal('git show a1b2c3d', RANGE)).toMatch(/only/);
    expect(bashRefusal('git show --stat a1b2c3d && cat .env', RANGE)).toMatch(/only/);
    expect(bashRefusal('git show --stat', RANGE)).toMatch(/only/);
  });

  it('refuses everything else', () => {
    expect(bashRefusal('git commit -am notes', RANGE)).toMatch(/only/);
    expect(bashRefusal('git push', RANGE)).toMatch(/only/);
    expect(bashRefusal('cat docs/CHANGELOG.md', RANGE)).toMatch(/only/);
  });
});

describe('resultOutcome', () => {
  it('fails without a result message', () => {
    expect(resultOutcome(undefined)).toEqual({ ok: false, reason: 'the run ended without a result message' });
  });

  it('fails on an error subtype and keeps its errors', () => {
    const outcome = resultOutcome({ subtype: 'error_max_turns', is_error: true, errors: ['8 turns used'] });
    expect(outcome).toEqual({ ok: false, reason: 'error_max_turns, is_error=true: 8 turns used' });
  });

  it('fails on a success flagged as an error', () => {
    const outcome = resultOutcome({ subtype: 'success', is_error: true, result: 'API error' });
    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toMatch(/API error/);
  });

  it('fails on a success without structured_output', () => {
    expect(resultOutcome({ subtype: 'success', is_error: false, result: 'done' })).toEqual({
      ok: false,
      reason: 'success without structured_output',
    });
  });

  it('passes the structured_output of a success through', () => {
    expect(resultOutcome({ subtype: 'success', is_error: false, structured_output: PAYLOAD })).toEqual({
      ok: true,
      payload: PAYLOAD,
    });
  });
});

describe('validatePayload', () => {
  it('accepts a payload that fits the schema', () => {
    expect(validatePayload(PAYLOAD)).toEqual([]);
  });

  it('rejects a payload that is not an object', () => {
    expect(validatePayload(null)).toEqual(['$ is null, expected object']);
    expect(validatePayload([])).toEqual(['$ is array, expected object']);
  });

  it('rejects missing and unknown keys at every level', () => {
    expect(validatePayload({ version: '0.2.0', entries: [], notes: 'x' })).toEqual([
      '$.previous is missing',
      '$.notes is not allowed',
    ]);
    expect(validatePayload(withEntries([{ type: 'added', summary: 'x', commits: ['a1b2c3d'], sha: 'a' }]))).toEqual([
      '$.entries[0].sha is not allowed',
    ]);
  });

  it('rejects an unknown type, a long or empty summary and a bad sha', () => {
    const entries = [
      { type: 'security', summary: 'x', commits: ['a1b2c3d'] },
      { type: 'added', summary: 'y'.repeat(91), commits: ['a1b2c3d'] },
      { type: 'added', summary: '', commits: ['A1B2C3D'] },
      { type: 'added', summary: 'z', commits: ['a1b2c3'] },
      { type: 'added', summary: 'w', commits: [] },
      { type: 'added', summary: 7, commits: 'a1b2c3d' },
    ];
    expect(validatePayload(withEntries(entries))).toEqual([
      '$.entries[0].type is not one of added|changed|fixed|internal',
      '$.entries[1].summary is 91 chars, max 90',
      '$.entries[2].summary is shorter than 1',
      '$.entries[2].commits[0] does not match ^[0-9a-f]{7,40}$',
      '$.entries[3].commits[0] does not match ^[0-9a-f]{7,40}$',
      '$.entries[4].commits has 0 items, min 1',
      '$.entries[5].summary is number, expected string',
      '$.entries[5].commits is string, expected array',
    ]);
  });

  it('accepts a summary of exactly 90 characters', () => {
    expect(validatePayload(withEntries([{ type: 'changed', summary: 'y'.repeat(90), commits: ['a1b2c3d'] }]))).toEqual(
      [],
    );
  });
});

describe('verifyNotes', () => {
  it('passes notes that match git and the file', () => {
    expect(verifyNotes(PAYLOAD, FACTS)).toEqual([]);
  });

  it('flags a wrong version or previous', () => {
    expect(verifyNotes({ ...PAYLOAD, version: '0.1.1', previous: 'v0.0.9' }, FACTS)).toEqual([
      'version is 0.1.1, expected 0.2.0',
      'previous is v0.0.9, expected v0.1.0',
    ]);
  });

  it('flags a commit filed twice, a missing commit and an unknown sha', () => {
    const entries = [
      { type: 'added', summary: 'Players can join the lobby by name', commits: ['a1b2c3d', 'd4e5f60'] },
      { type: 'fixed', summary: 'An empty player name is rejected', commits: ['b2c3d4e', 'a1b2c3d4e5f6'] },
    ];
    expect(verifyNotes(withEntries(entries), FACTS)).toEqual([
      'd4e5f60 is not a commit of v0.1.0..HEAD',
      'a1b2c3d "feat(lobby): create player" is filed 2 times, expected once',
      'c3d4e5f "ci: run pnpm check on pull requests" is filed 0 times, expected once',
    ]);
  });

  it('flags a sha prefix that matches more than one commit', () => {
    const commits = [...COMMITS, { sha: 'a1b2c3d9999999999999999999999999999999ff', subject: 'chore: bump deps' }];
    const problems = verifyNotes(PAYLOAD, { ...FACTS, commits });
    expect(problems).toContain('a1b2c3d is ambiguous in v0.1.0..HEAD');
  });

  it('flags a missing section', () => {
    expect(verifyNotes(PAYLOAD, { ...FACTS, date: '2026-10-27' })).toEqual([
      'docs/CHANGELOG.md has no line "## [0.2.0] - 2026-10-27"',
    ]);
  });

  it('flags a summary that is only in another section', () => {
    const changelog = CHANGELOG.replace('- Players can join the lobby by name (a1b2c3d)\n', '').replace(
      '- Project skeleton',
      '- Players can join the lobby by name',
    );
    expect(verifyNotes(PAYLOAD, { ...FACTS, changelog })).toEqual([
      '"## [0.2.0] - 2026-10-26" does not hold "Players can join the lobby by name"',
    ]);
  });

  it('flags a section that is not under ## Unreleased', () => {
    const changelog = CHANGELOG.replace('## Unreleased\n\n', '') + '\n## Unreleased\n';
    expect(verifyNotes(PAYLOAD, { ...FACTS, changelog })).toEqual([
      '"## [0.2.0] - 2026-10-26" is not under "## Unreleased"',
    ]);
  });
});
