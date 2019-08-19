# Pin Pal
Collaborative SVG-based drawing web application. 
Originally created as a final project for Rochester Institue of Technolog class ISTE-442: Secure Web Application Development

## Start Application:
1. Open a terminal emulator.
2. Change directory to this project's directory.
3. Run `npm install && npm start`.

## Areas of Interest
* Works on Mobile
 - View-Only; no edit capabilities
 - Can still chat and manage boards
* Can create personal boards (either private or public) in addition to the Lobby board to which all users get access automatically.
 - Can invite and kick users to boards as co-editors.
 - Each board has an associated Chat that all Editing members are added into.
* Concurrent writing on white boards:
 - Locks-out other users from drawing (for up to 5 seconds—lockout-time is variable and stored in a constants file) when someone is already drawing on the board.
 - After 5 seconds, the board will become unlocked and other users can begin drawing again.
