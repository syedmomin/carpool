Listed directory screens
Listed directory common

Based on my deep analysis of your current codebase (App and Server), here is a **Technical & UX Audit**. Inshallah, ye changes aapke app ko ek simple tool se ek premium, commercial-ready platform mein convert kar denge:

---

### 1. 🚀 Mobile App (Frontend) Improvements

*   **Haptic Feedback (Tactility)**: 
    *   **Suggestion**: Jab driver ride post kare ya passenger seat book kare, to `expo-haptics` use karke ek subtle vibration (haptic) dein. 
    *   **Why**: Isse app "premium" aur responsive mehsoos hoti hai.
*   **Skeleton Loaders**:
    *   **Suggestion**: `SearchScreen` aur `ActiveRides` mein jo generic simple spinner (ActivityIndicator) hai, uski jagah **Skeleton Views** (jo card ki shape jaisa dikhta hai) implement karein.
    *   **Why**: Isse user ko lagta hai app fast load ho rahi hai.
*   **Chat Enhancements**:
    *   **Suggestion**: `ChatScreen` mein **"Typing..." indicator** aur **"Read" receipts** (blue ticks) add karein Socket.IO ke zariye. 
    *   **Why**: User coordination bohat fast ho jati hai.
*   **Deep-Linking Notifications**:
    *   **Suggestion**: Jab notification aaye, to sirf popup na dikhayein, balkay us par click karne se **wahi specific booking ya ride** open honi chahiye.
    *   **Why**: Experience seamless ho jata hai.

### 2. 🛠️ Server (Backend) Improvements

*   **JWT Refresh Tokens**:
    *   **Suggestion**: Abhi aapka token expire hone par user logout ho jata hoga. **Access + Refresh Token** system implement karein.
    *   **Why**: User ko bar-bar login nahi karna parega, app background mein naya token le legi.
*   **Image Processing (Optimization)**:
    *   **Suggestion**: Jab user CNIC ya Vehicle photo upload kare, to server par `sharp` library use karke use **compress** karein save karne se pehle.
    *   **Why**: Database storage bachegi aur mobile par images jaldi load hongi.
*   **Fuzzy Search for Cities**:
    *   **Suggestion**: Search API mein exact city matching ki jagah **Fuzzy Search** (PostgreSQL Trigrams) use karein.
    *   **Why**: Agar koi "Karchi" likhe to use "Karachi" dikhna chahiye.
*   **Redis Caching**:
    *   **Suggestion**: Available rides aur active sessions ko **Redis** mein cache karein.
    *   **Why**: Database par load kam hoga aur search results "lightning fast" ho jayenge.

### 3. 🔌 Network & Sync Improvements

*   **Socket Heartbeat**:
    *   **Suggestion**: Client aur server ke darmyan ek **Ping/Pong** logic chalaein jo har 10-15 seconds mein connection check kare.
    *   **Why**: Pakistan mein internet fluctuations (mobile data) bohat hoti hain, socket connection drop hone par app ko foran reconnect hona chahiye.
*   **Offline Mode (Read-Only)**:
    *   **Suggestion**: Use `AsyncStorage` to cache the last viewed rides.
    *   **Why**: Agar user ka internet chala jaye, to wo purane bookings aur contact numbers bina internet ke bhi dekh sake.

---

### 🌟 My Recommendation:
Sabse pehle **"Skeleton Loaders"** aur **"Haptic Feedback"** add karein, kyunki ye user ko foran nazar aate hain aur app ka "Feel" change kar dete hain. 

**Kya aap chahte hain ke main in mein se kisi specific suggestion par kaam shuru karun?**