export const PAKISTAN_CITIES: string[] = [
  // Punjab
  'Lahore', 'Rawalpindi', 'Faisalabad', 'Multan', 'Gujranwala', 'Sialkot',
  'Bahawalpur', 'Sargodha', 'Sheikhupura', 'Jhang', 'Gujrat', 'Rahim Yar Khan',
  'Sahiwal', 'Okara', 'Kasur', 'Narowal', 'Hafizabad', 'Chiniot', 'Mandi Bahauddin',
  'Jhelum', 'Chakwal', 'Attock', 'Khushab', 'Mianwali', 'Bhakkar', 'Layyah',
  'Muzaffargarh', 'Dera Ghazi Khan', 'Vehari', 'Khanewal', 'Pakpattan',
  'Toba Tek Singh', 'Kamalia', 'Wazirabad', 'Daska', 'Sambrial', 'Pasrur',
  'Shakargarh', 'Phalia', 'Kot Addu', 'Ahmadpur East', 'Sadiqabad',
  // ICT
  'Islamabad',
  // Sindh
  'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpurkhas',
  'Jacobabad', 'Shikarpur', 'Khairpur', 'Dadu', 'Badin', 'Thatta', 'Sanghar',
  'Umerkot', 'Tando Adam', 'Tando Allahyar', 'Kandhkot', 'Ghotki', 'Kashmore', 'Qambar',
  // KPK
  'Peshawar', 'Abbottabad', 'Mardan', 'Mingora', 'Nowshera', 'Charsadda', 'Kohat',
  'Bannu', 'Dera Ismail Khan', 'Mansehra', 'Haripur', 'Karak', 'Swabi', 'Malakand',
  'Chitral', 'Battagram', 'Shangla', 'Buner', 'Lakki Marwat', 'Tank', 'Hangu',
  'Kurram', 'Timergara', 'Swat',
  // Balochistan
  'Quetta', 'Turbat', 'Khuzdar', 'Gwadar', 'Hub', 'Chaman', 'Zhob', 'Loralai',
  'Sibi', 'Kharan', 'Nushki', 'Kalat', 'Panjgur', 'Mastung', 'Washuk',
  // AJK
  'Mirpur', 'Muzaffarabad', 'Rawalakot', 'Kotli', 'Bhimber', 'Bagh', 'Haveli',
  // GB
  'Gilgit', 'Skardu', 'Hunza', 'Chilas', 'Ghanche', 'Astore',
];

export function isValidCity(city: string): boolean {
  return PAKISTAN_CITIES.includes(city);
}
