export const tools = {
  cekCuaca: {
    description: "Cek prakiraan cuaca untuk lokasi tertentu",
    parameters: {
      type: "object",
      properties: {
        lokasi: { type: "string", description: "Nama lokasi/desa" },
      },
      required: ["lokasi"],
    },
  },
  buatJadwalTanam: {
    description: "Buat jadwal tanam untuk tanaman tertentu",
    parameters: {
      type: "object",
      properties: {
        tanaman: { type: "string" },
        tanggal: {
          type: "string",
          description: "Tanggal mulai tanam (YYYY-MM-DD)",
        },
      },
      required: ["tanaman", "tanggal"],
    },
  },
  hitungKebutuhan: {
    description: "Hitung kebutuhan pupuk & air",
    parameters: {
      type: "object",
      properties: {
        luasHa: { type: "number", description: "Luas lahan dalam hektar" },
        dosisKgPerHa: { type: "number", description: "Dosis pupuk per hektar" },
        airLiterPerHa: {
          type: "number",
          description: "Kebutuhan air per hektar",
        },
      },
      required: ["luasHa", "dosisKgPerHa", "airLiterPerHa"],
    },
  },
};
