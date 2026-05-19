TAU GAMMA PHI – TRISKELION GRAND FRATERNITY
Asia 2 Community Chapter Website
===================================

FOLDER STRUCTURE
----------------
tgp-website/
│
├── index.html              ← Main website page (open this in a browser)
│
├── css/
│   └── style.css           ← All styles, colors, layout
│
├── js/
│   ├── members.js          ← Member list & data (edit this to update members)
│   └── main.js             ← Website interactivity (nav, filter, contact form)
│
└── images/
    ├── members/            ← Drop member profile photos here (see README inside)
    ├── projects/           ← Drop project/activity photos here (see README inside)
    └── gallery/            ← Drop event/gallery photos here (see README inside)


HOW TO OPEN
-----------
1. Double-click index.html in your file manager
   OR
2. Drag index.html into any web browser (Chrome, Edge, Firefox)


HOW TO ADD MEMBER PHOTOS
------------------------
1. Put the photo file in: images/members/
   Recommended name format: 01_cleck_pontillas.jpg
   Recommended size: 300x300 px square

2. Open js/members.js in any text editor (Notepad, VS Code)

3. Find the member entry, e.g.:
     { id: 1, name: 'Cleck Pontillas', role: 'Former Grand Triskelion', photo: '' },

4. Change photo: '' to:
     photo: 'images/members/01_cleck_pontillas.jpg'

5. Save the file and refresh the browser — photo will appear!


HOW TO ADD PROJECT PHOTOS
-------------------------
1. Put the photo in: images/projects/

2. Open index.html in a text editor

3. Find the project section comment, e.g.:
     <!-- To add a real photo: replace the div below with:
          <img src="images/projects/cleanup_drive_1.jpg" alt="...">
     -->

4. Replace the placeholder <div> block with:
     <img src="images/projects/cleanup_drive_1.jpg" alt="Community Clean-Up Drive">

5. Save and refresh browser.


HOW TO UPDATE HISTORY
---------------------
Open index.html and find the <!-- HISTORY --> section.
Each timeline entry has a <!-- TODO: --> comment.
Replace the text inside <p>...</p> and <div class="tl-year">...</div>
with the real dates and stories.


SUPABASE DATABASE CONFIGURATION & PRIVACY
-----------------------------------------
The member portal features full-stack Supabase integration for real-time registrations, OTP email approvals, contribution tracking, audit logs, and website contact form logging.

To run, go to Supabase Dashboard > SQL Editor > New Query and run:

  -- Create public.messages table
  CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
  );

  -- Disable RLS on public.messages for anonymous website inserts
  ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

Data Privacy Notice: Forms comply with the Data Privacy Act of 2012 (RA 10173). Consent warnings are integrated on registration and contact forms.


NEED MORE CHANGES?
------------------
- Colors:       Edit css/style.css → find :root { --gold: ... }
- Member list:  Edit js/members.js
- Org chart:    Edit index.html → find <!-- ORG CHART --> section
- Projects:     Edit index.html → find <!-- PROJECTS --> section


Built with: HTML5 · CSS3 · Vanilla JavaScript
No frameworks needed — just open in a browser!
