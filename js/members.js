/* ============================================================
   members.js — Member Data
   To add a photo: set photo to the image path, e.g.
   photo: 'images/members/01_cleck_pontillas.jpg'
   ============================================================ */

const MEMBERS = [
  { id: 1,  name: 'Cleck Pontillas',       role: 'Former Grand Triskelion',              photo: '' },
  { id: 2,  name: 'Gibe Ibuna',            role: 'Deputy Grand Triskelion',              photo: 'images/members/gibeibuna.jpg' },
  { id: 3,  name: 'Angelito Dagdag',       role: 'Former Master Wielder of the Whip',   photo: '' },
  { id: 4,  name: 'Laureano Pontejos',     role: 'Grand Triskelion',                     photo: 'images/members/laureanopontejos.jpg' },
  { id: 5,  name: 'Alvin De Guzman',       role: 'Brother',                              photo: '' },
  { id: 6,  name: 'Iver Chor Burlaos',     role: 'Brother',                              photo: '' },
  { id: 7,  name: 'Jonathan Pabillo',      role: 'Brother',                              photo: '' },
  { id: 8,  name: 'Mark Anthony Lama',     role: 'Master Wielder of the Whip – External', photo: 'images/members/markllama.jpg' },
  { id: 9,  name: 'Jerome Michael Flor',   role: 'Brother',                              photo: '' },
  { id: 10, name: 'Jonard De Hoya',        role: 'Brother',                              photo: '' },
  { id: 11, name: 'Jordan Landicho',       role: 'Brother',                              photo: '' },
  { id: 12, name: 'Jovin Dearl Abbilo',    role: 'Brother',                              photo: '' },
  { id: 13, name: 'Raffy Aragonin',        role: 'Brother',                              photo: '' },
  { id: 14, name: 'Joseph Fernandez',      role: 'Brother',                              photo: '' },
  { id: 15, name: 'Wayson Romero',         role: 'Brother',                              photo: '' },
  { id: 16, name: 'Johnrie Luzuriaga',     role: 'Brother',                              photo: '' },
  { id: 17, name: 'Lester Cuevas',         role: 'Brother',                              photo: '' },
  { id: 18, name: 'Angelo Jose Usero',     role: 'Brother',                              photo: '' },
  { id: 19, name: 'Danilo Arca Jr.',       role: 'Brother',                              photo: '' },
  { id: 20, name: 'John Clem Dela Cruz',   role: 'Brother',                              photo: '' },
  { id: 21, name: 'Henry James',           role: 'Brother',                              photo: '' },
  { id: 22, name: 'Paulo Suwali',          role: 'Brother',                              photo: '' },
  { id: 23, name: 'Jovanel Tulauan',       role: 'Brother',                              photo: '' },
  { id: 24, name: 'Christopher Abaquin',   role: 'Brother',                              photo: '' },
  { id: 25, name: 'Errol Felipe',          role: 'Master Triskelion Chairman',           photo: 'images/members/errolfelipe.jpg' },
  { id: 26, name: 'Danilo Dapitan',        role: 'Brother',                              photo: '' },
  { id: 27, name: 'James Lab-As',          role: 'Brother',                              photo: '' },
  { id: 28, name: 'Ryven Castolero',       role: 'Master Keeper of the Scroll',          photo: '' },
  { id: 29, name: 'Michael Lab-As',        role: 'Brother',                              photo: 'images/members/michaellabas.jpg' },
  { id: 30, name: 'JohnPaul Calera',       role: 'Master Triskelion',                    photo: '' },
  { id: 31, name: 'Marl Mueca',            role: 'Master Triskelion',                    photo: 'images/members/marlmueca.jpg' },
  { id: 32, name: 'Richard Flores',        role: 'Brother',                              photo: 'images/members/richardflores.jpg' },
  { id: 33, name: 'Kenneth Lawan',         role: 'Brother',                              photo: '' },
  { id: 34, name: 'Jerome Misa',           role: 'Master Wielder of the Whip – Internal', photo: 'images/members/jeromemisa.jpg' },
  { id: 35, name: 'John Michael Pura',     role: 'Brother',                              photo: '' },
  { id: 36, name: 'Aladin Olea',           role: 'Brother',                              photo: '' },
  { id: 37, name: 'Johnny Beltran',        role: 'Brother',                              photo: 'images/members/alvinbeltran.jpg' },
  { id: 38, name: 'John Paul Aquino',      role: 'Master Triskelion',                    photo: '' },
  { id: 39, name: 'Stephen Dela Torre',    role: 'Brother',                              photo: '' },
  { id: 40, name: 'Jeffrey De Chavez',     role: 'Brother',                              photo: 'images/members/jeffreydechavez.jpg' },
  { id: 41, name: 'Dexter Ebero',          role: 'Master Triskelion',                    photo: '' },
  { id: 42, name: 'John Errus Tolentino',  role: 'Brother',                              photo: '' },
  { id: 43, name: 'Alvin John Grata',      role: 'Brother',                              photo: '' },
  { id: 44, name: 'Edwin Villanueva',      role: 'Brother',                              photo: '' },
  { id: 45, name: 'Mark Ian Burgos',       role: 'Brother',                              photo: '' },
  { id: 46, name: 'Alvin Mallari',         role: 'Master Keeper of the Chest',           photo: 'images/members/alvinmallari.jpg' },
  { id: 47, name: 'Jomarie Ermino',        role: 'Brother',                              photo: '' },
  { id: 48, name: 'Kharl Kennett Gipa',    role: 'Master Triskelion',                    photo: 'images/members/karlgipa.jpg' },
  { id: 49, name: 'Wisdom Villareal',      role: 'Brother',                              photo: '' },
  { id: 50, name: 'Jhon Oliber Dela Cruz', role: 'Brother',                              photo: 'images/members/johndelacruz.jpg' },
  { id: 51, name: 'Jhun Refugia',          role: 'Master Triskelion',                    photo: 'images/members/jhunrefugia.jpg' },
  { id: 52, name: 'Jomari Livero',         role: 'Brother',                              photo: '' },
];

/* Helper: get initials from full name */
function getInitials(name) {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/* Classify member tier for filtering */
function getMemberTier(role) {
  const r = role.toLowerCase();
  if (r.includes('grand triskelion') && r.includes('former')) return 'former';
  if (r.includes('grand triskelion') || r.includes('deputy')) return 'leadership';
  if (r.includes('master')) return 'master';
  return 'brother';
}
