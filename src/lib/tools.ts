// src/lib/tools.ts

export async function cekCuaca(lokasi: string) {
  return `Cuaca di ${lokasi}: cerah, curah hujan rendah.`;
}

export async function buatJadwalTanam(tanaman: string, tanggal: string) {
  return `Jadwal tanam untuk ${tanaman} dimulai ${tanggal}, panen sekitar 90 hari kemudian.`;
}

export async function hitungKebutuhan(
  luasHa: number,
  dosisKgPerHa: number,
  airLiterPerHa: number
) {
  const totalPupuk = luasHa * dosisKgPerHa;
  const totalAir = luasHa * airLiterPerHa;
  return `Untuk ${luasHa} ha: butuh ${totalPupuk} kg pupuk & ${totalAir} liter air.`;
}
