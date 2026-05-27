-- Set all NULL handicaps to 0 (scratch)
UPDATE "User" SET handicap = 0 WHERE handicap IS NULL;

-- Normalize gender values
UPDATE "User" SET gender = 'MALE' WHERE LOWER(gender) IN ('male', 'm', 'man');
UPDATE "User" SET gender = 'FEMALE' WHERE LOWER(gender) IN ('female', 'f', 'woman');
UPDATE "User" SET gender = 'OTHER' WHERE LOWER(gender) IN ('other', 'non-binary');
UPDATE "User" SET gender = NULL WHERE gender = '' OR gender IS NULL;

-- Report violations
SELECT id, email, handicap, gender,
  CASE 
    WHEN gender = 'MALE' AND handicap > 28 THEN 'EXCEEDS_MALE_MAX'
    WHEN gender = 'FEMALE' AND handicap > 36 THEN 'EXCEEDS_FEMALE_MAX'
    ELSE 'OK'
  END as status
FROM "User"
WHERE (gender = 'MALE' AND handicap > 28)
   OR (gender = 'FEMALE' AND handicap > 36);
