-- board. Down of 0006_board_properties_room_id: drops the column (it has no index).
ALTER TABLE properties DROP COLUMN room_id;
