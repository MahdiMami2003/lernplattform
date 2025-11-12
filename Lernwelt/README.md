# Lernwelt-Frontend

## 💻 Developing

### ⚙️ Initialize Svelte-Kit
Follow these steps:
<dl>
    <dt>Usually phpstorm is suggesting all the needed plugins per pop-up</dt>
    <dd style="list-style: none">-> Install them</dd>
    <dt>If not:</dt>
    <dd>-> Navigate to 'Plugins' and install "Svelte" and "Svelte Templates"</dd>
</dl>

---
### 👾 Use the Terminal -> local for the following commands
#### Assumption: Your Terminal looks similar to: <br>
<div style="font-style: italic"> C:\Users\Username\FH Aachen\SE\gruppe-5a-1> </div>

Navigation to "Lernwelt"-folder by using:
```
cd Lernwelt
```

When you arrived in the "Lernwelt"-folder type:
```
npm install
# there might be some errors, as long as your "run dev" later works, ignore them.
```
To start a localhost-server type:
```
npm run dev
```

#### ✅ Your project is "ready to go" now

---

## 📂 Folder structures:

### 🧭 Legend:

- `#` → **Ordner**, die im Pfad vorkommen
- `- ()` → **Virtuelle Ordner**, nur zur Sortierung (nicht Teil des Pfads)
- `+` → **Dateien**

```text
- routes
--
 |__ - (all-others)
 |  |  
 |  |__ - (account_level)
 |  |  |
 |  |  |__ - (no_login_required)
 |  |  |  |  
 |  |  |  |__ # material_page_id14 ("/material_page_id14")
 |  |  |  |
 |  |  |  |__ # no_login_page_id7 ("/no_login_page_id7")
 |  |  |
 |  |  |__ - (parents_account)
 |  |  |  |
 |  |  |  |__ # parents_landing_page ("/parents_landing_page")
 |  |  |  |
 |  |  |  |__ # appointments_page_id8 ("/appointments_page_id8")
 |  |  |  |
 |  |  |  |__ # pedagogy_page_id10 ("/pedagogy_page_id10")
 |  |  |
 |  |  |__ - (student_account)
 |  |  |  |
 |  |  |  |__ - (test + games)
 |  |  |  |  |
 |  |  |  |  |__ # game_page_id12 ("/game_page_id12")
 |  |  |  |  |
 |  |  |  |  |__ # weekly_test_page_id17 ("/weekly_test_page_id17")
 |  |  |  |
 |  |  |  |__ # progress_page_id11 ("/progress_page_id11")
 |  |  |  |
 |  |  |  |__ # student_landing_page_id5 ("/student_landing_page_id5")
 |  |  |
 |  |  |__ - (teacher_account)
 |  |  |  |
 |  |  |  |__ - (classes)
 |  |  |  |  |
 |  |  |  |  |__ # class_page_id9 ("/class_page_id9")
 |  |  |  |
 |  |  |  |__ # overview_page_id13 ("/overview_page_id13")
 |  |  |  |
 |  |  |  |__ # teacher_landing_page_id6 ("/teacher_landing_page_id6")
 |  |  |
 |  |  |__ # login_page_id2 ("/login_page_id2")
 |  |  |
 |  |  |__ # register_page_i3 ("/register_page_i3")
 |  |
 |  |__ # imprint_page_id15 ("/imprint_page_id15")
 |  |
 |  |__ + layout.svelte //holy Stylesheet DONT CHANGE!
 |
 | 
 |__ + layout.svelte //general Stylesheet
 |__ + page.svelte //(landing_page_id1) ("/")
```
## 🌐 Paths / Routes examples

| Page                 | Path                        | Description                          |
| -------------------- | --------------------------- | ------------------------------------ |
| Landing Page         | `/`                         | Project homepage                     |
| Login Page           | `/login_page_id2`           | Login for all user groups            |
| Register Page        | `/register_page_i3`         | User registration page               |
| Student Landing Page | `/student_landing_page_id5` | Dashboard for students               |
| Teacher Landing Page | `/teacher_landing_page_id6` | Dashboard for teachers               |
| Parents Landing Page | `/parents_landing_page`     | Dashboard for parents                |
| Material Page        | `/material_page_id14`       | Public materials (no login required) |
| Imprint Page         | `/imprint_page_id15`        | Legal imprint page                   |
| Weekly Test Page     | `/weekly_test_page_id17`    | Weekly test section                  |
| Game Page            | `/game_page_id12`           | Games and activities area            |

