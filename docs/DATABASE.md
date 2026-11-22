# Database design

```mermaid
erDiagram
  User ||--o{ Project : manages
  User ||--o| Contractor : "profile"
  Project ||--o{ Task : has
  Project ||--o{ Milestone : has
  Project ||--o{ Expense : has
  Project ||--o{ ProgressReport : has
  Project }o--o{ Contractor : "ProjectContractor"
  Task ||--o{ TaskComment : has
  Task ||--o{ TaskHistory : has
  Task }o--o{ Task : "TaskDependency"
  Task }o--o| User : assignee
  Task }o--o| Contractor : contractor
  ExpenseCategory ||--o{ Expense : groups
  MaterialCategory ||--o{ Material : groups
  Material ||--o{ StockHistory : logs
  Material ||--o{ MaterialRequest : requested
  User ||--o{ Notification : receives
  User ||--o{ ActivityLog : performs
  User ||--o{ Session : has
  User ||--o{ Account : has
```

Key rules: unique `User.email`, `Material.sku`; composite keys on `ProjectContractor` and `TaskDependency`; indexes on `Task(projectId,status)`, `Task(deadline)`, `Expense(projectId)`, `Expense(date)`.
