# Database Design

```mermaid
erDiagram
    %% ===== Core Identity =====
    User ||--o| Contractor : "has profile"
    User ||--o{ Session : has
    User ||--o{ Account : has
    User ||--o{ Notification : receives
    User ||--o{ ActivityLog : performs

    %% ===== Projects =====
    User ||--o{ Project : "manages"
    Project }o--o{ Contractor : "ProjectContractor"
    Project ||--o{ Milestone : has
    Project ||--o{ Task : has
    Project ||--o{ Expense : has
    Project ||--o{ ProgressReport : has
    Project ||--o{ MaterialRequest : has

    %% ===== Tasks =====
    Task }o--o| User : "assignee"
    Task }o--o| Contractor : "assigned to"
    Task ||--o{ TaskComment : has
    Task ||--o{ TaskHistory : has
    Task }o--o{ Task : "TaskDependency"

    %% ===== Finance =====
    ExpenseCategory ||--o{ Expense : groups

    %% ===== Materials =====
    MaterialCategory ||--o{ Material : groups
    Material ||--o{ StockHistory : logs
    Material ||--o{ MaterialRequest : "requested via"
