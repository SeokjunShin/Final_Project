-- V13__update_cards_pan_to_full.sql
UPDATE cards SET masked_pan = '4532-1234-5678-1234' WHERE id = 1001;
UPDATE cards SET masked_pan = '5425-9876-5432-5678' WHERE id = 1002;
UPDATE cards SET masked_pan = '4716-2345-6789-2345' WHERE id = 2001;
UPDATE cards SET masked_pan = '5312-8765-4321-6789' WHERE id = 2002;
UPDATE cards SET masked_pan = '4929-3456-7890-3456' WHERE id = 3001;
UPDATE cards SET masked_pan = '5198-6543-2109-7890' WHERE id = 3002;
