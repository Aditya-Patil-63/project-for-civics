CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    head VARCHAR(255),
    contact VARCHAR(255),
    staff INT,
    budget VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS workers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    department VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active',
    phone VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id VARCHAR(50),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by VARCHAR(50),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comment TEXT
);
