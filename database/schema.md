# Database Schema

## Users Table

| Column              | Type                     | Constraints                               |
| ------------------- | ------------------------ | ----------------------------------------- |
| id                  | INT                      | Primary Key, Auto-increment               |
| username            | VARCHAR(255)             | Unique, Not Null                          |
| email               | VARCHAR(255)             | Unique, Not Null                          |
| password_hash       | VARCHAR(255)             | Not Null                                  |
| role                | ENUM('student', 'teacher') | Not Null                                  |
| first_name          | VARCHAR(255)             |                                           |
| last_name           | VARCHAR(255)             |                                           |
| profile_picture_url | VARCHAR(255)             | Nullable                                  |
| created_at          | TIMESTAMP                | Default CURRENT_TIMESTAMP                 |
| updated_at          | TIMESTAMP                | Default CURRENT_TIMESTAMP on update |

## Courses Table

| Column      | Type          | Constraints                               | Notes                                     |
| ----------- | ------------- | ----------------------------------------- | ----------------------------------------- |
| id          | INT           | Primary Key, Auto-increment               |                                           |
| title       | VARCHAR(255)  | Not Null                                  |                                           |
| description | TEXT          | Nullable                                  |                                           |
| teacher_id  | INT           | Not Null, Foreign Key (users.id)          | References the teacher who created the course |
| created_at  | TIMESTAMP     | Default CURRENT_TIMESTAMP                 |                                           |
| updated_at  | TIMESTAMP     | Default CURRENT_TIMESTAMP on update       |                                           |

## Chapters Table

| Column    | Type          | Constraints                               | Notes                                     |
| --------- | ------------- | ----------------------------------------- | ----------------------------------------- |
| id        | INT           | Primary Key, Auto-increment               |                                           |
| course_id | INT           | Not Null, Foreign Key (courses.id)        | References the course this chapter belongs to |
| title     | VARCHAR(255)  | Not Null                                  |                                           |
| content   | TEXT          | Nullable                                  | Content of the chapter (e.g., Markdown, HTML) |
| order     | INT           | Not Null                                  | Order of the chapter within the course    |
| created_at| TIMESTAMP     | Default CURRENT_TIMESTAMP                 |                                           |
| updated_at| TIMESTAMP     | Default CURRENT_TIMESTAMP on update       |                                           |

## Enrollments Table (Association Table)

| Column      | Type      | Constraints                                     | Notes                                            |
| ----------- | --------- | ----------------------------------------------- | ------------------------------------------------ |
| id          | INT       | Primary Key, Auto-increment                     | Simple PK for the enrollment record itself       |
| student_id  | INT       | Not Null, Foreign Key (users.id)                | References the student enrolled in the course    |
| course_id   | INT       | Not Null, Foreign Key (courses.id)              | References the course the student is enrolled in |
| enrolled_at | TIMESTAMP | Default CURRENT_TIMESTAMP                       | Timestamp of when the enrollment occurred        |
|             |           | Unique Constraint (student_id, course_id)       | Ensures a student can enroll in a course only once |

## Assignments Table

| Column      | Type          | Constraints                                       | Notes                                     |
| ----------- | ------------- | ------------------------------------------------- | ----------------------------------------- |
| id          | INT           | Primary Key, Auto-increment                       |                                           |
| course_id   | INT           | Not Null, Foreign Key (courses.id)                | Course the assignment belongs to          |
| chapter_id  | INT           | Nullable, Foreign Key (chapters.id)               | Optional: Chapter the assignment is related to |
| title       | VARCHAR(255)  | Not Null                                          |                                           |
| description | TEXT          | Nullable                                          |                                           |
| due_date    | TIMESTAMP     | Nullable                                          |                                           |
| created_at  | TIMESTAMP     | Default CURRENT_TIMESTAMP                         |                                           |
| updated_at  | TIMESTAMP     | Default CURRENT_TIMESTAMP on update               |                                           |

## Submissions Table

| Column          | Type                                  | Constraints                                               | Notes                                     |
| --------------- | ------------------------------------- | --------------------------------------------------------- | ----------------------------------------- |
| id              | INT                                   | Primary Key, Auto-increment                               |                                           |
| assignment_id   | INT                                   | Not Null, Foreign Key (assignments.id)                    | Assignment this submission is for         |
| student_id      | INT                                   | Not Null, Foreign Key (users.id)                          | Student who made the submission           |
| submission_type | ENUM('text', 'file_upload')           | Not Null                                                  | Type of submission content                |
| content_text    | TEXT                                  | Nullable                                                  | For text-based submissions                |
| file_url        | VARCHAR(2048)                         | Nullable                                                  | For file upload submissions               |
| submitted_at    | TIMESTAMP                             | Default CURRENT_TIMESTAMP                                 |                                           |
| grade           | VARCHAR(255)                          | Nullable                                                  | e.g., "A+", "85/100", "Pass"             |
| feedback        | TEXT                                  | Nullable                                                  | Teacher's feedback on the submission      |
|                 |                                       | Unique Constraint (assignment_id, student_id)             | Ensures one submission per student per assignment |
