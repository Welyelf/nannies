-- House of Nannies — Seed Data
-- One invented candidate for the trial demo

INSERT INTO candidates (
  first_name,
  last_name,
  headline,
  bio,
  experience_years,
  specialties,
  certifications,
  hourly_rate,
  photo_url,
  status
) VALUES (
  'Margaret',
  'Chen',
  'Experienced Newborn Care Specialist & Family Educator',
  'Margaret brings over 12 years of dedicated experience in newborn and infant care, having supported more than 40 families across the Tri-State area. She specializes in establishing healthy sleep routines, breastfeeding support, and creating calm, structured environments for both newborns and new parents. Known for her warm demeanor and meticulous attention to detail, Margaret has worked with families in Greenwich, the Upper East Side, and the Hamptons. She holds a degree in Early Childhood Education from Columbia University and is certified in infant CPR, sleep consulting, and lactation support. Families consistently describe her as a calming presence who makes the transition to parenthood feel effortless.',
  12,
  ARRAY['Newborn Care', 'Sleep Training', 'Breastfeeding Support', 'Multiples Experience', 'Travel-Ready'],
  ARRAY['Certified Newborn Care Specialist (NCS)', 'Infant & Child CPR — American Red Cross', 'Certified Sleep Consultant — IACSC', 'Lactation Educator Counselor (CLC)'],
  '$45–65/hr',
  NULL,
  'draft'
);
