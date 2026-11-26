CREATE DATABASE IF NOT EXISTS expense_tracker;
USE expense_tracker;

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  profile_image LONGTEXT
);

CREATE TABLE accounts (
  account_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE payment_methods (
  payment_method_id INT AUTO_INCREMENT PRIMARY KEY,
  method_name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE transactions (
  transaction_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_id INT NOT NULL,
  category_id INT NOT NULL,
  payment_method_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  transaction_type ENUM('Income','Expense') NOT NULL,
  transaction_date DATE NOT NULL,
  description VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(account_id),
  FOREIGN KEY (category_id) REFERENCES categories(category_id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(payment_method_id)
);

CREATE TABLE budgets (
  budget_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  budget_amount DECIMAL(12,2) NOT NULL,
  month_num TINYINT NOT NULL,
  year_num SMALLINT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

INSERT INTO users(name,email,password_hash) VALUES
('Demo User','demo@example.com','demo-password');

INSERT INTO categories(category_name) VALUES
('Food'),('Transport'),('Education'),('Bills'),('Shopping'),('Entertainment'),('Salary');

INSERT INTO payment_methods(method_name) VALUES
('Cash'),('Debit Card'),('Bank Transfer'),('Online Payment');

INSERT INTO accounts(user_id,account_name,account_type,current_balance) VALUES
(1,'Cash','Cash',5000),
(1,'Bank Account','Savings',40000);

INSERT INTO transactions(user_id,account_id,category_id,payment_method_id,amount,transaction_type,transaction_date,description)
VALUES
(1,1,1,1,650,'Expense','2026-09-11','Lunch'),
(1,2,3,3,2000,'Expense','2026-09-10','Course fee'),
(1,2,7,3,50000,'Income','2026-09-01','Monthly salary');

INSERT INTO budgets(user_id,category_id,budget_amount,month_num,year_num)
VALUES (1,1,10000,9,2026);
