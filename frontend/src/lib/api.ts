import { DashboardData, DailyLogData, WeightLogData, UserSettingsData, AiReviewData, MealLogData, FoodItemData } from "@/types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers }, cache: "no-store" });
  if (!res.ok) throw new Error(`API ${url} failed: ${res.status}`);
  return res.json();
}

export const api = {
   async getDashboard(userId: number): Promise<DashboardData> {
    const data = await request<{ user: { name: string; currentWeight: number; targetWeight: number; initialWeight: number; heightCm: number }; stats: { currentWeight: number; targetWeight: number; progressPercent: number; dayNumber: number } }>(`/api/dashboard?userId=${userId}`);
    return {
      currentWeight: data.stats.currentWeight,
      targetWeight: data.stats.targetWeight,
      startingWeight: data.user.initialWeight,
      progressPercentage: data.stats.progressPercent,
      activeDays: data.stats.dayNumber,
      userHandshakeName: data.user.name,
      heightCm: data.user.heightCm,
    };
  },

  async getDaily(userId: number, date: string): Promise<DailyLogData> {
    return request<DailyLogData>(`/api/daily?userId=${userId}&date=${date}`);
  },

  async analyzeFoodPhoto(imageBase64: string, userId: number): Promise<{ name: string; serving: string; calories: number; protein: number; carbs: number; fat: number }> {
  return request(`/api/ai/food-photo`, { method: "POST", body: JSON.stringify({ image: imageBase64, userId }) });
},

  async saveDaily(userId: number, log: DailyLogData): Promise<DailyLogData> {
    return request<DailyLogData>(`/api/daily?userId=${userId}`, { method: "POST", body: JSON.stringify(log) });
  },

  async getWeights(userId: number): Promise<WeightLogData[]> {
    return request<WeightLogData[]>(`/api/weight?userId=${userId}`);
  },

  async chatCoach(messages: { role: 'user' | 'assistant'; content: string }[], userId: number): Promise<{ reply: string }> {
  return request(`/api/ai/chat`, { method: "POST", body: JSON.stringify({ messages, userId }) });
},
  async logWeight(userId: number, weight: number, date?: string): Promise<WeightLogData> {
    const targetDate = date || new Date().toISOString().split("T")[0];
    return request<WeightLogData>(`/api/weight?userId=${userId}`, { method: "POST", body: JSON.stringify({ weight, date: targetDate }) });
  },

  async getSettings(userId: number): Promise<UserSettingsData> {
    const user = await request<UserSettingsData>(`/api/user?userId=${userId}`);
    return user ?? { name: userId === 1 ? "Rian" : "Wahyu", heightCm: 175, currentWeight: 86, targetWeight: 65, workoutTime: "07:00", sleepTime: "22:00", proteinTargetGrams: 120 };
  },

  async saveSettings(userId: number, settings: UserSettingsData): Promise<UserSettingsData> {
    return request<UserSettingsData>(`/api/user?userId=${userId}`, { method: "POST", body: JSON.stringify(settings) });
  },
async estimateFood(query: string): Promise<{ name: string; quantity: number; calories: number; protein: number; carbs: number; fat: number; perServing: number }> {
  return request(`/api/ai/food-estimate`, { method: "POST", body: JSON.stringify({ query }) });
},

async getAiReviewPersonal(userId: number): Promise<{ date: string; review: string }> {
  return request(`/api/ai/review`, { method: "POST", body: JSON.stringify({ userId }) });
},

  async searchFoods(q: string): Promise<FoodItemData[]> {
  return request<FoodItemData[]>(`/api/foods?q=${encodeURIComponent(q)}`);
},

async getMeals(userId: number, date: string): Promise<MealLogData[]> {
  return request<MealLogData[]>(`/api/meals?userId=${userId}&date=${date}`);
},

async logMeal(userId: number, meal: Omit<MealLogData, "id">): Promise<MealLogData> {
  return request<MealLogData>(`/api/meals?userId=${userId}`, { method: "POST", body: JSON.stringify(meal) });
},

async deleteMeal(id: number): Promise<void> {
  await request(`/api/meals?id=${id}`, { method: "DELETE" });
},

  async getAiReview(userId: number, date: string): Promise<AiReviewData> {
    const todayLog = await this.getDaily(userId, date).catch(() => null);

    const pool = {
      sleep: [
        "Matikan layar 30 menit sebelum jam tidur (22:00) untuk mempermudah recovery harian.",
        "Turunkan suhu kamar 1-2°C agar tubuh lebih cepat masuk fase deep sleep.",
        "Hindari kafein setelah jam 14:00 supaya kualitas tidur malam tidak terganggu.",
        "Lakukan stretching ringan 5 menit sebelum tidur untuk menurunkan tensi otot.",
        "Pasang mode malam di HP agar blue light tidak menekan produksi melatonin.",
        "Tidur dan bangun di jam yang sama setiap hari, termasuk akhir pekan, untuk ritme sirkadian stabil.",
        "Jauhkan HP dari jangkauan tangan saat tidur agar tidak tergoda scroll tengah malam.",
      ],
      water: [
        "Minum 500ml air putih begitu bangun tidur untuk memicu pembakaran kalori alami.",
        "Siapkan botol 1L di meja kerja dan targetkan habis sebelum makan siang.",
        "Minum 1 gelas air 20 menit sebelum makan untuk membantu kontrol porsi.",
        "Tambahkan irisan lemon atau mentimun biar air putih terasa lebih segar dan gampang habis.",
        "Setel alarm tiap 90 menit sebagai pengingat minum, terutama saat fokus kerja.",
        "Pantau warna urin — kuning pucat tanda hidrasi cukup, kuning pekat berarti kurang minum.",
      ],
      protein: [
        "Pastikan porsi dada ayam / telur ditambah saat makan malam agar otot terlindungi.",
        "Targetkan 25-30g protein di setiap kali makan, bukan ditumpuk di satu waktu saja.",
        "Siapkan camilan tinggi protein seperti greek yogurt atau edamame untuk sela-sela makan.",
        "Tambahkan 1 scoop whey setelah latihan untuk mempercepat pemulihan otot.",
        "Variasikan sumber protein (ayam, ikan, tempe, telur) agar mikronutrien lebih lengkap.",
        "Masak telur rebus batch di awal minggu supaya stok protein praktis selalu siap.",
      ],
      workout: [
        "Lakukan jalan santai 15 menit paska makan siang untuk mengontrol gula darah.",
        "Fokus pada progressive overload: tambah beban atau repetisi sedikit dari sesi sebelumnya.",
        "Mulai dengan 5 menit pemanasan dinamis agar cedera terhindar dan performa maksimal.",
        "Kalau malas berat, komitmen minimal 10 menit gerak — biasanya momentum akan berlanjut.",
        "Latih otot besar (kaki, punggung, dada) dulu karena membakar kalori paling efisien.",
        "Catat angka latihan hari ini supaya progres mingguan bisa terlihat nyata.",
        "Akhiri sesi dengan 5 menit pendinginan agar nyeri otot besok berkurang.",
      ],
      fasting: [
        "Perpanjang jendela puasa 30 menit bertahap jika 16:8 sudah terasa nyaman.",
        "Saat jam rawan lapar, minum teh tanpa gula atau air soda plain untuk menahan craving.",
        "Pindahkan makan malam lebih awal agar durasi fasting malam otomatis memanjang.",
        "Isi jam puasa dengan aktivitas ringan supaya pikiran tidak terus tertuju ke makanan.",
        "Pastikan makan pertama setelah puasa kaya protein & serat agar kenyang lebih lama.",
      ],
      snack: [
        "Singkirkan stok snack manis di meja kerja agar tidak tergoda craving saat kerja.",
        "Ganti cemilan keripik dengan kacang panggang tanpa garam untuk lemak yang lebih sehat.",
        "Jangan belanja dalam keadaan lapar — daftar belanja ketat menghindarkan impulse buy junk food.",
        "Kalau craving manis menyerang, coba tunggu 10 menit sambil minum air, biasanya reda.",
        "Sediakan buah potong di kulkas sebagai opsi ngemil default yang rendah kalori.",
      ],
      mindset: [
        "Ingat alasan awal memulai — konsistensi kecil tiap hari mengalahkan motivasi sesaat.",
        "Rayakan kemenangan kecil hari ini, sekecil apa pun, untuk membangun identitas baru.",
        "Satu hari buruk tidak menghapus progres berminggu-minggu. Reset di makan berikutnya, bukan besok.",
        "Fokus pada proses (habit), bukan hanya angka timbangan, agar mental tetap stabil.",
        "Bandingkan diri hanya dengan versi dirimu kemarin, bukan dengan orang lain.",
        "Visualisasikan versi lean idealmu setiap pagi selama 30 detik untuk memperkuat komitmen.",
      ],
      recovery: [
        "Luangkan 10 menit foam rolling di area yang tegang untuk mempercepat pemulihan.",
        "Pastikan asupan magnesium (sayur hijau, pisang) untuk mengurangi kram & memperbaiki tidur.",
        "Ambil 1 hari deload ringan jika badan terasa sangat lelah agar tidak overtraining.",
        "Tidur siang power nap 15-20 menit boleh jika kurang tidur, tapi jangan lebih agar tidak pusing.",
      ],
    };

    const targeted: string[] = [];
    if (!todayLog || !todayLog.sleepCompleted) targeted.push(...pool.sleep);
    if (!todayLog || !todayLog.waterCompleted) targeted.push(...pool.water);
    if (!todayLog || !todayLog.proteinCompleted) targeted.push(...pool.protein);
    if (!todayLog || !todayLog.workout) targeted.push(...pool.workout);
    if (!todayLog || !todayLog.ifCompleted) targeted.push(...pool.fasting);
    if (!todayLog || !todayLog.noSnack) targeted.push(...pool.snack);

    const general = [...pool.mindset, ...pool.recovery];
    const shuffle = <T,>(arr: T[]): T[] => arr.sort(() => Math.random() - 0.5);

    const pickTargeted = shuffle(targeted).slice(0, 3);
    const pickGeneral = shuffle(general).slice(0, 2);
    let points = [...pickTargeted, ...pickGeneral];

    if (targeted.length === 0) {
      points = [
        "Semua habit tercapai sempurna hari ini! Konsistensi 100% terjaga — luar biasa.",
        "Pertahankan waktu tidur disiplin untuk memaksimalkan metabolisme tubuh.",
        ...shuffle(general).slice(0, 2),
        "Karena dasar sudah solid, coba tantang diri: tambah intensitas latihan 5% minggu ini.",
      ];
    }

    points = shuffle(points).slice(0, 5);

    return { date, actionablePoints: points, rawSummary: points.join("\n") };
  },
};