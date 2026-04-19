// Fixed city list for Pakistan — used everywhere: search, socket rooms, DB filtering
// Consistent names across frontend + backend = no typo mismatch

export const PAKISTAN_CITIES: string[] = [
  // ── Punjab ──────────────────────────────────────────────────────────────────
  'Lahore', 'Rawalpindi', 'Faisalabad', 'Multan', 'Gujranwala', 'Sialkot',
  'Bahawalpur', 'Sargodha', 'Sheikhupura', 'Jhang', 'Gujrat', 'Rahim Yar Khan',
  'Sahiwal', 'Okara', 'Kasur', 'Narowal', 'Hafizabad', 'Chiniot', 'Mandi Bahauddin',
  'Jhelum', 'Chakwal', 'Attock', 'Khushab', 'Mianwali', 'Bhakkar', 'Layyah',
  'Muzaffargarh', 'Dera Ghazi Khan', 'Vehari', 'Khanewal', 'Pakpattan',
  'Toba Tek Singh', 'Kamalia', 'Wazirabad', 'Daska', 'Sambrial', 'Pasrur',
  'Shakargarh', 'Phalia', 'Kot Addu', 'Ahmadpur East', 'Sadiqabad',
  'Murree', 'Taxila', 'Wah Cantt', 'Burewala', 'Arifwala', 'Lodhran',
  'Rajanpur', 'Taunsa Sharif', 'Mian Channu', 'Pattoki', 'Renala Khurd',
  'Jaranwala', 'Muridke', 'Shorkot', 'Pir Mahal', 'Gojra', 'Chunian',
  'Deepalpur', 'Haveli Lakha', 'Hujra Shah Muqeen', 'Kabirwala', 'Shujabad',
  'Jalalpur Pirwala', 'Alipur', 'Karor Lal Esan', 'Noorpur Thal', 'Quaidabad',
  'Pindi Bhattian', 'Lalamusa', 'Dina', 'Sohawa', 'Sarai Alamgir', 'Bhalwal',
  'Shahpur', 'Minchinabad', 'Chishtian', 'Fort Abbas', 'Haroonabad',

  // ── Islamabad Capital Territory ──────────────────────────────────────────
  'Islamabad', 'Bara Kahu', 'Tarnol', 'Sihala',

  // ── Sindh ───────────────────────────────────────────────────────────────────
  'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpurkhas',
  'Jacobabad', 'Shikarpur', 'Khairpur', 'Dadu', 'Badin', 'Thatta', 'Sanghar',
  'Umerkot', 'Tando Adam', 'Tando Allahyar', 'Kandhkot', 'Ghotki', 'Kashmore',
  'Qambar', 'Jamshoro', 'Moro', 'Sehwan Sharif', 'Mirpur Mathelo', 'Ubauro',
  'Hala', 'Matli', 'Kotri', 'Pano Aqil', 'Gambat', 'Ranipur', 'Mehrabpur',
  'Khipro', 'Tando Muhammad Khan', 'Shahdadpur', 'Shahdadkot', 'Sakrand',
  'Naushahro Feroze', 'Mithi', 'Nagarparkar', 'Bulri Shah Karim',

  // ── Khyber Pakhtunkhwa ───────────────────────────────────────────────────
  'Peshawar', 'Abbottabad', 'Mardan', 'Mingora', 'Nowshera', 'Charsadda',
  'Kohat', 'Bannu', 'Dera Ismail Khan', 'Mansehra', 'Haripur', 'Karak',
  'Swabi', 'Malakand', 'Chitral', 'Battagram', 'Shangla', 'Buner',
  'Lakki Marwat', 'Tank', 'Hangu', 'Kurram', 'Timergara', 'Swat',
  'Risalpur', 'Topi', 'Dir Upper', 'Dir Lower', 'Parachinar', 'Landi Kotal',
  'Jamrud', 'Batkhela', 'Saidu Sharif', 'Besham', 'Dasu', 'Kalam', 'Naran',
  'Kaghan', 'Torkham',

  // ── Balochistan ─────────────────────────────────────────────────────────────
  'Quetta', 'Turbat', 'Khuzdar', 'Gwadar', 'Hub', 'Chaman', 'Zhob', 'Loralai',
  'Sibi', 'Kharan', 'Nushki', 'Kalat', 'Panjgur', 'Mastung', 'Washuk',
  'Pishin', 'Dera Murad Jamali', 'Pasni', 'Ormara', 'Jiwani', 'Usta Mohammad',
  'Barkhan', 'Dalbandin', 'Dera Bugti', 'Kohlu', 'Mach', 'Sui',

  // ── Azad Jammu & Kashmir ─────────────────────────────────────────────────
  'Mirpur', 'Muzaffarabad', 'Rawalakot', 'Kotli', 'Bhimber', 'Bagh',
  'Haveli', 'Dadyal', 'Pallandri', 'Athmuqam', 'Sharda', 'Kel', 'Keran',
  'Hajira', 'Sudhanoti',

  // ── Gilgit-Baltistan ─────────────────────────────────────────────────────
  'Gilgit', 'Skardu', 'Hunza', 'Chilas', 'Ghanche', 'Astore', 'Khaplu',
  'Karimabad', 'Nagar', 'Ishkoman', 'Passu', 'Aliabad', 'Gupis',
];

// Sorted alphabetically for display
export const CITIES_SORTED = [...PAKISTAN_CITIES].sort((a, b) => a.localeCompare(b));

// Popular/major cities shown by default before user types
export const POPULAR_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
  'Hyderabad', 'Abbottabad', 'Bahawalpur', 'Sargodha', 'Sukkur',
];

export function searchCities(query: string): string[] {
  if (!query.trim()) return POPULAR_CITIES;
  const q = query.trim().toLowerCase();
  return PAKISTAN_CITIES.filter(city => city.toLowerCase().includes(q));
}
