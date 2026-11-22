# API documentation

The app uses Next.js Server Actions (type-safe RPC). All actions verify the session and role on the server.

## HTTP endpoints

| Method   | Path            | Access             | Description                              |
| -------- | --------------- | ------------------ | ---------------------------------------- |
| GET/POST | /api/auth/\*    | public             | Better Auth (sign-in, sign-out, session) |
| GET      | /reports/export | Admin, PM, Finance | Expenses CSV                             |

## Server actions

| Module             | Action                                                  | Roles                                            |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------ |
| auth               | loginAction, registerAction (always Contractor)         | public                                           |
| project            | createProject, updateProject, deleteProject             | Admin, PM (delete: Admin)                        |
| project-contractor | assignContractor, removeContractor                      | Admin, PM (own)                                  |
| milestone          | createMilestone, toggleMilestone, deleteMilestone       | Admin, PM (own)                                  |
| task               | createTask, updateTask, addDependency, removeDependency | Admin, PM (own)                                  |
| task               | changeTaskStatus, addComment                            | all task roles in scope; COMPLETED only Admin/PM |
| expense            | createExpense, createExpenseCategory                    | Admin, Finance                                   |
| material           | createMaterial, stockIn                                 | Admin, PM                                        |
| material           | recordUsage                                             | Admin, PM, Engineer                              |
| material           | requestMaterial / reviewRequest                         | Contractor / Admin, PM                           |
| progress           | submitProgress (photos max 4, 3 MB)                     | Engineer, Contractor                             |
| contractor         | createContractor, updateContractor                      | Admin, PM                                        |
| user               | createUser, changeUserRole, setUserActive               | Admin                                            |
| settings           | updateProfile, changePassword                           | any user                                         |
| notification       | markRead, markAllRead                                   | owner only                                       |
