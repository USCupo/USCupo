import AsyncStorage from '@react-native-async-storage/async-storage';

// Preferencia de tema del usuario. 'sistema' sigue al dispositivo hasta que el usuario elija.
export type PreferenciaTema = 'sistema' | 'claro' | 'oscuro';

const CLAVE_TEMA = 'uscupo.preferencia-tema';

export async function leerPreferenciaTema(): Promise<PreferenciaTema> {
  try {
    const valor = await AsyncStorage.getItem(CLAVE_TEMA);
    return valor === 'claro' || valor === 'oscuro' ? valor : 'sistema';
  } catch {
    return 'sistema';
  }
}

export async function guardarPreferenciaTema(preferencia: PreferenciaTema): Promise<void> {
  try {
    if (preferencia === 'sistema') await AsyncStorage.removeItem(CLAVE_TEMA);
    else await AsyncStorage.setItem(CLAVE_TEMA, preferencia);
  } catch {
    // Sin almacenamiento disponible (modo privado del navegador): el tema vale solo esta sesión.
  }
}
