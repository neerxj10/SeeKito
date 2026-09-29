-- Development seed for the bounded Algebra concept graph.
-- This seed is deterministic and safe to rerun. It does not create Auth users.

insert into public.concepts (
  id, name, slug, description, subject, difficulty,
  estimated_minutes, is_active, diagnostic_weight
)
values
  ('10000000-0000-0000-0000-000000000001', 'Basic Arithmetic', 'basic-arithmetic', 'Foundational arithmetic operations required for manipulating algebraic expressions.', 'ALGEBRA', 'BEGINNER', 30, true, 1.0),
  ('10000000-0000-0000-0000-000000000002', 'Algebraic Expressions', 'algebraic-expressions', 'Variables, constants, coefficients, terms, and simplifying expressions.', 'ALGEBRA', 'BEGINNER', 45, true, 1.0),
  ('10000000-0000-0000-0000-000000000003', 'Linear Equations', 'linear-equations', 'Solving equations involving variables with a first-degree relationship.', 'ALGEBRA', 'INTERMEDIATE', 50, true, 1.0),
  ('10000000-0000-0000-0000-000000000004', 'Inequalities', 'inequalities', 'Representing and solving inequalities, including their solutions on a number line.', 'ALGEBRA', 'INTERMEDIATE', 45, true, 1.0),
  ('10000000-0000-0000-0000-000000000005', 'Factorisation', 'factorisation', 'Breaking algebraic expressions into products of simpler expressions.', 'ALGEBRA', 'INTERMEDIATE', 55, true, 1.0),
  ('10000000-0000-0000-0000-000000000006', 'Quadratic Equations', 'quadratic-equations', 'Solving and analyzing equations involving second-degree polynomial expressions.', 'ALGEBRA', 'ADVANCED', 65, true, 1.0),
  ('10000000-0000-0000-0000-000000000007', 'Polynomial Operations', 'polynomial-operations', 'Adding, subtracting, multiplying, and simplifying polynomial expressions.', 'ALGEBRA', 'ADVANCED', 60, true, 1.0),
  ('10000000-0000-0000-0000-000000000008', 'Polynomial Applications', 'polynomial-applications', 'Applying polynomial models to patterns, quantities, and algebraic relationships.', 'ALGEBRA', 'ADVANCED', 70, true, 1.0),
  ('10000000-0000-0000-0000-000000000009', 'Algebraic Word Problems', 'algebraic-word-problems', 'Translating real-world statements into equations and solving them systematically.', 'ALGEBRA', 'ADVANCED', 60, true, 1.0),
  ('10000000-0000-0000-0000-000000000010', 'Coordinate Algebra', 'coordinate-algebra', 'Using coordinates, graphs, and equations to describe relationships on the plane.', 'ALGEBRA', 'INTERMEDIATE', 55, true, 1.0)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  subject = excluded.subject,
  difficulty = excluded.difficulty,
  estimated_minutes = excluded.estimated_minutes,
  is_active = excluded.is_active,
  diagnostic_weight = excluded.diagnostic_weight;

insert into public.concept_prerequisites (concept_id, prerequisite_concept_id, required_mastery, priority)
values
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 0.70, 1),
  ('10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 0.70, 1),
  ('10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 0.70, 1),
  ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 0.75, 1),
  ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', 0.75, 2),
  ('10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', 0.80, 1),
  ('10000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 0.70, 1),
  ('10000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000007', 0.80, 1),
  ('10000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 0.75, 1),
  ('10000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', 0.70, 1),
  ('10000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 0.75, 2)
on conflict (concept_id, prerequisite_concept_id) do update set
  required_mastery = excluded.required_mastery,
  priority = excluded.priority;

insert into public.questions (
  id, concept_id, question_text, question_type, difficulty, options,
  correct_answer, explanation, hint, is_active, is_diagnostic
)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'What is 7 + 5?', 'MCQ', 'EASY', '["10","11","12","13"]'::jsonb, '"12"'::jsonb, 'Adding 7 and 5 gives 12.', 'Count five forward from seven.', true, true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Evaluate 18 - 3 × 4.', 'SHORT_ANSWER', 'MEDIUM', '[]'::jsonb, '"6"'::jsonb, 'Multiplication comes before subtraction: 3 × 4 = 12, then 18 - 12 = 6.', 'Apply multiplication before subtraction.', true, false),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Which number is greatest?', 'MCQ', 'HARD', '["-2","0","-5","-1"]'::jsonb, '"0"'::jsonb, 'Zero is greater than every negative number listed.', 'On a number line, numbers farther right are greater.', true, false),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'In 4x + 7, which number is the coefficient of x?', 'MCQ', 'EASY', '["4","7","x","11"]'::jsonb, '"4"'::jsonb, 'The coefficient is the number multiplying the variable, so it is 4.', 'Look for the number directly multiplying x.', true, true),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Simplify 3x + 2x - 4.', 'SHORT_ANSWER', 'MEDIUM', '[]'::jsonb, '"5x - 4"'::jsonb, 'Combine the like terms 3x and 2x to get 5x; the constant remains -4.', 'Only combine terms with the same variable part.', true, false),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'Which expression is equivalent to 2(a + 3)?', 'MCQ', 'HARD', '["2a + 3","2a + 6","a + 6","2a + 5"]'::jsonb, '"2a + 6"'::jsonb, 'Distribute 2 to both terms: 2a + 2 × 3 = 2a + 6.', 'Multiply the outside factor by every term inside the parentheses.', true, false),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', 'Solve x + 6 = 10.', 'SHORT_ANSWER', 'EASY', '[]'::jsonb, '"4"'::jsonb, 'Subtract 6 from both sides to get x = 4.', 'Undo the addition by subtracting 6.', true, true),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'Solve 3x = 21.', 'SHORT_ANSWER', 'MEDIUM', '[]'::jsonb, '"7"'::jsonb, 'Divide both sides by 3, giving x = 7.', 'Use the inverse operation of multiplication.', true, false),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 'Solve 2x - 5 = 13.', 'MCQ', 'HARD', '["4","8","9","18"]'::jsonb, '"9"'::jsonb, 'Add 5 to get 2x = 18, then divide by 2 to get x = 9.', 'Isolate the constant before dividing by the coefficient.', true, false),
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000004', 'Which value satisfies x > 3?', 'MCQ', 'EASY', '["2","3","4","-4"]'::jsonb, '"4"'::jsonb, '4 is the only listed value greater than 3.', 'The symbol > means strictly greater than.', true, true),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004', 'Solve x - 4 ≤ 2.', 'SHORT_ANSWER', 'MEDIUM', '[]'::jsonb, '"x ≤ 6"'::jsonb, 'Add 4 to both sides, so x ≤ 6.', 'Undo subtraction by adding 4.', true, false),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004', 'When multiplying an inequality by a negative number, what happens to the inequality sign?', 'MCQ', 'HARD', '["It stays the same","It reverses","It becomes an equals sign","It disappears"]'::jsonb, '"It reverses"'::jsonb, 'Multiplication by a negative reverses the order on the number line.', 'Think about multiplying -2 < 1 by -1.', true, false),
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000005', 'Factor x² + 5x.', 'MCQ', 'EASY', '["x(x + 5)","5x(x + 1)","x²(1 + 5)","(x + 5)²"]'::jsonb, '"x(x + 5)"'::jsonb, 'The greatest common factor is x, leaving x + 5.', 'Find the greatest common factor of both terms.', true, true),
  ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000005', 'Factor x² + 7x + 12.', 'SHORT_ANSWER', 'MEDIUM', '[]'::jsonb, '"(x + 3)(x + 4)"'::jsonb, 'Find two numbers that multiply to 12 and add to 7: 3 and 4.', 'Look for factor pairs of 12 whose sum is 7.', true, false),
  ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000005', 'Which is the complete factorisation of 4x² - 25?', 'MCQ', 'HARD', '["(2x - 5)(2x + 5)","(4x - 5)(x + 5)","(2x - 25)(2x + 1)","(4x - 25)(x + 1)"]'::jsonb, '"(2x - 5)(2x + 5)"'::jsonb, 'This is a difference of squares: (2x)² - 5².', 'Use a² - b² = (a - b)(a + b).', true, false),
  ('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000006', 'Which equation is quadratic?', 'MCQ', 'EASY', '["x + 2 = 0","3x = 9","x² - 4 = 0","x/2 = 1"]'::jsonb, '"x² - 4 = 0"'::jsonb, 'A quadratic equation contains a variable raised to the second power.', 'Look for the x² term.', true, true),
  ('20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000006', 'Solve x² - 9 = 0.', 'SHORT_ANSWER', 'MEDIUM', '[]'::jsonb, '"x = 3 or x = -3"'::jsonb, 'x² = 9, so x can be either square root of 9: 3 or -3.', 'Remember that both 3 and -3 square to 9.', true, false),
  ('20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000006', 'What are the roots of x² - 5x + 6 = 0?', 'MCQ', 'HARD', '["1 and 6","2 and 3","-2 and -3","0 and 6"]'::jsonb, '"2 and 3"'::jsonb, 'Factor as (x - 2)(x - 3) = 0, giving roots 2 and 3.', 'Find two numbers with product 6 and sum 5.', true, false),
  ('20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000007', 'Simplify 3x + 2x.', 'SHORT_ANSWER', 'EASY', '[]'::jsonb, '"5x"'::jsonb, 'These are like terms, so add their coefficients: 3 + 2 = 5.', 'Add coefficients while keeping the variable.', true, true),
  ('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000007', 'Expand (x + 2)(x + 3).', 'SHORT_ANSWER', 'MEDIUM', '[]'::jsonb, '"x² + 5x + 6"'::jsonb, 'Multiply each term: x² + 3x + 2x + 6, then combine like terms.', 'Use distribution or a two-by-two multiplication grid.', true, false),
  ('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000007', 'What is the degree of 4x³ - x + 8?', 'MCQ', 'HARD', '["1","2","3","8"]'::jsonb, '"3"'::jsonb, 'The highest exponent of x is 3, so the polynomial has degree 3.', 'Find the largest exponent on the variable.', true, false),
  ('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000008', 'If P(x) = x² + 2x, what is P(3)?', 'SHORT_ANSWER', 'EASY', '[]'::jsonb, '"15"'::jsonb, 'Substitute 3: 3² + 2(3) = 9 + 6 = 15.', 'Replace every x with 3 before calculating.', true, true),
  ('20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000008', 'Which expression models the area of a rectangle with sides x and x + 4?', 'MCQ', 'MEDIUM', '["x + 4","x² + 4","x² + 4x","2x + 4"]'::jsonb, '"x² + 4x"'::jsonb, 'Area is the product x(x + 4) = x² + 4x.', 'Multiply the two side lengths.', true, false),
  ('20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000008', 'A polynomial model is f(t) = t² - 4t + 7. What is f(2)?', 'SHORT_ANSWER', 'HARD', '[]'::jsonb, '"3"'::jsonb, 'f(2) = 4 - 8 + 7 = 3.', 'Substitute t = 2 carefully, including the negative term.', true, false),
  ('20000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000009', 'A number increased by 5 is 12. Which equation represents this?', 'MCQ', 'EASY', '["x - 5 = 12","x + 5 = 12","5x = 12","x/5 = 12"]'::jsonb, '"x + 5 = 12"'::jsonb, 'Increased by 5 means add 5 to the unknown number.', 'Translate “increased by” as addition.', true, true),
  ('20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000009', 'A taxi charges 4 dollars plus 2 dollars per mile. What is the cost for 6 miles?', 'SHORT_ANSWER', 'MEDIUM', '[]'::jsonb, '"16"'::jsonb, 'The cost is 4 + 2(6) = 16 dollars.', 'Start with the fixed charge, then add the per-mile charge.', true, false),
  ('20000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000009', 'The sum of two consecutive integers is 41. What is the larger integer?', 'SHORT_ANSWER', 'HARD', '[]'::jsonb, '"21"'::jsonb, 'Let the integers be n and n + 1: 2n + 1 = 41, so n = 20 and the larger is 21.', 'Represent consecutive integers as n and n + 1.', true, false),
  ('20000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000010', 'What is the x-coordinate of (4, -2)?', 'MCQ', 'EASY', '["-2","2","4","6"]'::jsonb, '"4"'::jsonb, 'The x-coordinate is the first number in an ordered pair.', 'Ordered pairs are written (x, y).', true, true),
  ('20000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000010', 'What is the slope of y = 3x + 2?', 'SHORT_ANSWER', 'MEDIUM', '[]'::jsonb, '"3"'::jsonb, 'In y = mx + b, m is the slope. Here m = 3.', 'Compare the equation with slope-intercept form.', true, false),
  ('20000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000010', 'Which equation represents the line through (0, 2) with slope -1?', 'MCQ', 'HARD', '["y = x + 2","y = -x + 2","y = -x - 2","y = 2x - 1"]'::jsonb, '"y = -x + 2"'::jsonb, 'Use y = mx + b with m = -1 and b = 2.', 'The y-intercept is the y-value when x is zero.', true, false)
on conflict (id) do update set
  concept_id = excluded.concept_id,
  question_text = excluded.question_text,
  question_type = excluded.question_type,
  difficulty = excluded.difficulty,
  options = excluded.options,
  correct_answer = excluded.correct_answer,
  explanation = excluded.explanation,
  hint = excluded.hint,
  is_active = excluded.is_active,
  is_diagnostic = excluded.is_diagnostic;
