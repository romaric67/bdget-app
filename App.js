import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  Vibration,
  Share,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [budgetData, setBudgetData] = useState({
    // Revenus
    salary: '',
    otherIncome: '',
    
    // Dépenses fixes
    rent: '',
    utilities: '',
    internet: '',
    insurance: '',
    transport: '',
    
    // Dépenses variables
    food: '',
    clothing: '',
    entertainment: '',
    health: '',
    otherExpenses: '',
    
    // Épargne
    emergency: '',
    projects: '',
    investments: ''
  });

  const [totals, setTotals] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    remaining: 0
  });

  // Charger les données au démarrage
  useEffect(() => {
    loadBudgetData();
  }, []);

  // Recalculer les totaux quand les données changent
  useEffect(() => {
    calculateTotals();
    saveBudgetData();
  }, [budgetData]);

  const loadBudgetData = async () => {
    try {
      const saved = await AsyncStorage.getItem('budgetData');
      if (saved) {
        setBudgetData(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Erreur de chargement:', error);
    }
  };

  const saveBudgetData = async () => {
    try {
      await AsyncStorage.setItem('budgetData', JSON.stringify(budgetData));
    } catch (error) {
      console.log('Erreur de sauvegarde:', error);
    }
  };

  const calculateTotals = () => {
    const income = parseFloat(budgetData.salary || 0) + parseFloat(budgetData.otherIncome || 0);
    
    const expenses = parseFloat(budgetData.rent || 0) +
                    parseFloat(budgetData.utilities || 0) +
                    parseFloat(budgetData.internet || 0) +
                    parseFloat(budgetData.insurance || 0) +
                    parseFloat(budgetData.transport || 0) +
                    parseFloat(budgetData.food || 0) +
                    parseFloat(budgetData.clothing || 0) +
                    parseFloat(budgetData.entertainment || 0) +
                    parseFloat(budgetData.health || 0) +
                    parseFloat(budgetData.otherExpenses || 0) +
                    parseFloat(budgetData.emergency || 0) +
                    parseFloat(budgetData.projects || 0) +
                    parseFloat(budgetData.investments || 0);

    setTotals({
      totalIncome: income,
      totalExpenses: expenses,
      remaining: income - expenses
    });
  };

  const updateValue = (field, value) => {
    setBudgetData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const getPercentage = (amount, total) => {
    if (total === 0) return '0%';
    return ((amount / total) * 100).toFixed(1) + '%';
  };

  const resetBudget = () => {
    Alert.alert(
      'Réinitialiser le budget',
      'Êtes-vous sûr de vouloir effacer toutes les données ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: () => {
            setBudgetData({
              salary: '', otherIncome: '', rent: '', utilities: '', internet: '',
              insurance: '', transport: '', food: '', clothing: '', entertainment: '',
              health: '', otherExpenses: '', emergency: '', projects: '', investments: ''
            });
            Vibration.vibrate(50);
          }
        }
      ]
    );
  };

  const exportToCSV = async () => {
    const csvData = [
      'BUDGET MANAGER - FCFA',
      `Date: ${new Date().toLocaleDateString('fr-FR')}`,
      '',
      'REVENUS,Montant (FCFA),Pourcentage',
      `Salaire net mensuel,${budgetData.salary || '0'},${getPercentage(parseFloat(budgetData.salary || 0), totals.totalIncome)}`,
      `Autres revenus,${budgetData.otherIncome || '0'},${getPercentage(parseFloat(budgetData.otherIncome || 0), totals.totalIncome)}`,
      '',
      'DÉPENSES FIXES,Montant (FCFA),Pourcentage',
      `Loyer,${budgetData.rent || '0'},${getPercentage(parseFloat(budgetData.rent || 0), totals.totalIncome)}`,
      `Électricité/Gaz/Eau,${budgetData.utilities || '0'},${getPercentage(parseFloat(budgetData.utilities || 0), totals.totalIncome)}`,
      `Internet/Téléphone,${budgetData.internet || '0'},${getPercentage(parseFloat(budgetData.internet || 0), totals.totalIncome)}`,
      `Assurances,${budgetData.insurance || '0'},${getPercentage(parseFloat(budgetData.insurance || 0), totals.totalIncome)}`,
      `Transport,${budgetData.transport || '0'},${getPercentage(parseFloat(budgetData.transport || 0), totals.totalIncome)}`,
      '',
      'DÉPENSES VARIABLES,Montant (FCFA),Pourcentage',
      `Alimentation,${budgetData.food || '0'},${getPercentage(parseFloat(budgetData.food || 0), totals.totalIncome)}`,
      `Vêtements,${budgetData.clothing || '0'},${getPercentage(parseFloat(budgetData.clothing || 0), totals.totalIncome)}`,
      `Loisirs,${budgetData.entertainment || '0'},${getPercentage(parseFloat(budgetData.entertainment || 0), totals.totalIncome)}`,
      `Santé,${budgetData.health || '0'},${getPercentage(parseFloat(budgetData.health || 0), totals.totalIncome)}`,
      `Autres,${budgetData.otherExpenses || '0'},${getPercentage(parseFloat(budgetData.otherExpenses || 0), totals.totalIncome)}`,
      '',
      'ÉPARGNE,Montant (FCFA),Pourcentage',
      `Épargne urgence,${budgetData.emergency || '0'},${getPercentage(parseFloat(budgetData.emergency || 0), totals.totalIncome)}`,
      `Épargne projets,${budgetData.projects || '0'},${getPercentage(parseFloat(budgetData.projects || 0), totals.totalIncome)}`,
      `Investissements,${budgetData.investments || '0'},${getPercentage(parseFloat(budgetData.investments || 0), totals.totalIncome)}`,
      '',
      'RÉSUMÉ',
      `Total Revenus,${formatCurrency(totals.totalIncome)}`,
      `Total Dépenses,${formatCurrency(totals.totalExpenses)}`,
      `Solde Restant,${formatCurrency(totals.remaining)}`
    ].join('\n');

    try {
      const fileUri = FileSystem.documentDirectory + `budget_${new Date().toISOString().split('T')[0]}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvData);
      await Sharing.shareAsync(fileUri);
      Vibration.vibrate(100);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter le fichier');
    }
  };

  const shareBudget = () => {
    const message = `📊 MON BUDGET PERSONNEL - FCFA

💵 REVENUS:
• Salaire net: ${budgetData.salary || '0'} FCFA
• Autres revenus: ${budgetData.otherIncome || '0'} FCFA
• TOTAL REVENUS: ${formatCurrency(totals.totalIncome)}

🏠 DÉPENSES FIXES:
• Loyer: ${budgetData.rent || '0'} FCFA
• Électricité/Gaz/Eau: ${budgetData.utilities || '0'} FCFA
• Internet/Téléphone: ${budgetData.internet || '0'} FCFA
• Assurances: ${budgetData.insurance || '0'} FCFA
• Transport: ${budgetData.transport || '0'} FCFA

🛒 DÉPENSES VARIABLES:
• Alimentation: ${budgetData.food || '0'} FCFA
• Vêtements: ${budgetData.clothing || '0'} FCFA
• Loisirs: ${budgetData.entertainment || '0'} FCFA
• Santé: ${budgetData.health || '0'} FCFA
• Autres: ${budgetData.otherExpenses || '0'} FCFA

🏦 ÉPARGNE:
• Épargne d'urgence: ${budgetData.emergency || '0'} FCFA
• Épargne projets: ${budgetData.projects || '0'} FCFA
• Investissements: ${budgetData.investments || '0'} FCFA

📈 RÉSUMÉ:
• Total Dépenses: ${formatCurrency(totals.totalExpenses)}
• Solde Restant: ${formatCurrency(totals.remaining)}

📅 Date: ${new Date().toLocaleDateString('fr-FR')}
📱 Généré par Budget Manager`;

    Share.share({
      message: message,
      title: 'Mon Budget FCFA'
    });
    Vibration.vibrate(50);
  };

  const InputField = ({ label, value, field, placeholder = "0" }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => updateValue(field, text)}
          placeholder={placeholder}
          keyboardType="numeric"
          onFocus={() => Vibration.vibrate(30)}
        />
        <View style={styles.percentageBadge}>
          <Text style={styles.percentageText}>
            {getPercentage(parseFloat(value || 0), totals.totalIncome)}
          </Text>
        </View>
      </View>
    </View>
  );

  const SectionCard = ({ title, icon, children, gradient }) => (
    <LinearGradient colors={gradient} style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      
      {/* Header */}
      <LinearGradient colors={['#2c3e50', '#3498db']} style={styles.header}>
        <Text style={styles.headerTitle}>💰 Budget Manager</Text>
        <Text style={styles.headerSubtitle}>Gérez vos finances en FCFA</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Résumé */}
        <SectionCard 
          title="Résumé du Budget" 
          icon="📊" 
          gradient={['#f8f9fa', '#e9ecef']}
        >
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>💵 Total Revenus</Text>
            <Text style={[styles.summaryValue, styles.incomeColor]}>
              {formatCurrency(totals.totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>💸 Total Dépenses</Text>
            <Text style={[styles.summaryValue, styles.expenseColor]}>
              {formatCurrency(totals.totalExpenses)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>💰 Solde Restant</Text>
            <Text style={[
              styles.summaryValue, 
              styles.balanceValue,
              totals.remaining >= 0 ? styles.positiveBalance : styles.negativeBalance
            ]}>
              {formatCurrency(totals.remaining)}
            </Text>
          </View>
        </SectionCard>

        {/* Revenus */}
        <SectionCard 
          title="Revenus" 
          icon="💵" 
          gradient={['#ffffff', '#f8f9fa']}
        >
          <InputField 
            label="Salaire net mensuel" 
            value={budgetData.salary} 
            field="salary" 
          />
          <InputField 
            label="Autres revenus" 
            value={budgetData.otherIncome} 
            field="otherIncome" 
          />
        </SectionCard>

        {/* Dépenses Fixes */}
        <SectionCard 
          title="Dépenses Fixes" 
          icon="🏠" 
          gradient={['#ffffff', '#f8f9fa']}
        >
          <InputField label="Loyer / Prêt immobilier" value={budgetData.rent} field="rent" />
          <InputField label="Électricité / Gaz / Eau" value={budgetData.utilities} field="utilities" />
          <InputField label="Internet / Téléphone" value={budgetData.internet} field="internet" />
          <InputField label="Assurances" value={budgetData.insurance} field="insurance" />
          <InputField label="Transport" value={budgetData.transport} field="transport" />
        </SectionCard>

        {/* Dépenses Variables */}
        <SectionCard 
          title="Dépenses Variables" 
          icon="🛒" 
          gradient={['#ffffff', '#f8f9fa']}
        >
          <InputField label="Alimentation" value={budgetData.food} field="food" />
          <InputField label="Vêtements" value={budgetData.clothing} field="clothing" />
          <InputField label="Loisirs / Sorties" value={budgetData.entertainment} field="entertainment" />
          <InputField label="Santé" value={budgetData.health} field="health" />
          <InputField label="Autres dépenses" value={budgetData.otherExpenses} field="otherExpenses" />
        </SectionCard>

        {/* Épargne */}
        <SectionCard 
          title="Épargne & Investissements" 
          icon="🏦" 
          gradient={['#ffffff', '#f8f9fa']}
        >
          <InputField label="Épargne d'urgence" value={budgetData.emergency} field="emergency" />
          <InputField label="Épargne projets" value={budgetData.projects} field="projects" />
          <InputField label="Investissements" value={budgetData.investments} field="investments" />
        </SectionCard>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navButton, styles.secondaryButton]} 
          onPress={resetBudget}
        >
          <Text style={styles.navButtonText}>🔄 Reset</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, styles.successButton]} 
          onPress={exportToCSV}
        >
          <Text style={styles.navButtonText}>📊 Excel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, styles.primaryButton]} 
          onPress={shareBudget}
        >
          <Text style={styles.navButtonText}>📋 Partager</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  sectionCard: {
    borderRadius: 16,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    fontSize: 16,
    paddingRight: 70,
  },
  percentageBadge: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  percentageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeColor: {
    color: '#27ae60',
  },
  expenseColor: {
    color: '#e74c3c',
  },
  balanceValue: {
    fontSize: 18,
  },
  positiveBalance: {
    color: '#27ae60',
  },
  negativeBalance: {
    color: '#e74c3c',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  secondaryButton: {
    backgroundColor: '#95a5a6',
  },
  successButton: {
    backgroundColor: '#27ae60',
  },
  navButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomSpacing: {
    height: 20,
  },
});
