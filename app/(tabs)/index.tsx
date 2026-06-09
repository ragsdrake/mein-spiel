import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function App() {
  // 1. STATE: Die Ressourcen des Planeten
  const [energy, setEnergy] = useState(0);
  const [biomass, setBiomass] = useState(0);

  // 2. STATE: Die Generatoren (Upgrades)
  const [solarCount, setSolarCount] = useState(0);
  const [labCount, setLabCount] = useState(0);

  // 3. GAME LOOP: Der 1-Sekunden-Taktgeber
  useEffect(() => {
    const timer = setInterval(() => {
      setEnergy((prevEnergy) => prevEnergy + (solarCount * 1)); // 1 Energie pro Solar-Kollektor
      setBiomass((prevBiomass) => prevBiomass + (labCount * 0.5)); // 0.5 Biomasse pro Hydro-Labor
    }, 1000);

    // Aufräumen, wenn die Komponente neu lädt, um Speicherlecks zu vermeiden
    return () => clearInterval(timer);
  }, [solarCount, labCount]);

  // 4. MATHEMATIK: Exponentielle Kostenberechnung
  const solarCost = Math.floor(10 * Math.pow(1.15, solarCount));
  const labCost = Math.floor(50 * Math.pow(1.15, labCount));

  // 5. LOGIK: Kauf-Funktionen
  const buySolar = () => {
    if (energy >= solarCost) {
      setEnergy((prev) => prev - solarCost);
      setSolarCount((prev) => prev + 1);
    }
  };

  const buyLab = () => {
    if (energy >= labCost) {
      setEnergy((prev) => prev - labCost);
      setLabCount((prev) => prev + 1);
    }
  };

  // 6. UI: Die grafische Ausgabe
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PLANETARY OVERRIDE</Text>
        <Text style={styles.subtitle}>System Status: Kritisch</Text>
      </View>

      <View style={styles.resourceBoard}>
        <Text style={styles.resourceText}>Energie: {Math.floor(energy)}</Text>
        <Text style={styles.resourceText}>Biomasse: {biomass.toFixed(1)}</Text>
      </View>

      <View style={styles.controlPanel}>
        {/* Manueller Klicker */}
        <TouchableOpacity style={styles.actionButton} onPress={() => setEnergy(energy + 1)}>
          <Text style={styles.buttonText}>+ 1 Energie manuell erzeugen</Text>
        </TouchableOpacity>

        {/* Upgrade 1 */}
        <TouchableOpacity 
          style={[styles.upgradeButton, energy < solarCost && styles.buttonDisabled]} 
          onPress={buySolar}
          disabled={energy < solarCost}
        >
          <Text style={styles.upgradeTitle}>Solar-Kollektor bauen ({solarCount})</Text>
          <Text style={styles.upgradeCost}>Kosten: {solarCost} Energie</Text>
        </TouchableOpacity>

        {/* Upgrade 2 */}
        <TouchableOpacity 
          style={[styles.upgradeButton, energy < labCost && styles.buttonDisabled]} 
          onPress={buyLab}
          disabled={energy < labCost}
        >
          <Text style={styles.upgradeTitle}>Hydro-Labor bauen ({labCount})</Text>
          <Text style={styles.upgradeCost}>Kosten: {labCost} Energie</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a', // Tiefschwarz/Grau für technischen Look
    padding: 20,
  },
  header: {
    marginTop: 40,
    borderBottomWidth: 1,
    borderColor: '#333',
    paddingBottom: 10,
    marginBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#ff4444', // Roter Alarm-Akzent
    fontSize: 14,
    marginTop: 5,
  },
  resourceBoard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  resourceText: {
    color: '#00ffcc', // Technisches Cyan
    fontSize: 20,
    fontFamily: 'Courier', // Monospace-Look
    marginBottom: 10,
  },
  controlPanel: {
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#005544',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  upgradeButton: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
    borderColor: '#222',
  },
  upgradeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  upgradeCost: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
  },
});