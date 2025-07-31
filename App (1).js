// App.js - Fichier principal à mettre dans votre projet Expo
import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  SafeAreaView, 
  TextInput, 
  Button, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  ScrollView 
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
const Tab = createBottomTabNavigator();
// Context pour la gestion globale de l'état
const BudgetContext = React.createContext();
const BudgetProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([
    'Alimentation', 'Transport', 'Logement', 'Loisirs', 'Santé', 'Autre'
  ]);
  // Charger les données au démarrage
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      const savedTransactions = await AsyncStorage.getItem('transactions');
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };
  const saveData = async (newTransactions) => {
    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(newTransactions));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };
  const addTransaction = (transaction) => {
    const newTransaction = {
      id: Date.now().toString(),
      ...transaction,
      date: new Date().toISOString(),
    };
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    saveData(updatedTransactions);
  };
  const deleteTransaction = (id) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    saveData(updatedTransactions);
  };
  const getBalance = () => {
    return transactions.reduce((total, transaction) => {
      return transaction.type === 'income' 
        ? total + transaction.amount 
        : total - transaction.amount;
    }, 0);
  };
  const getIncomes = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((total, t) => total + t.amount, 0);
  };
  const getExpenses = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((total, t) => total + t.amount, 0);
  };
  return (
    <BudgetContext.Provider value={{
      transactions,
      categories,
      addTransaction,
      deleteTransaction,
      getBalance,
      getIncomes,
      getExpenses
    }}>
      {children}
    </BudgetContext.Provider>
  );
};
const App = () => {
  return (
    <BudgetProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === "Accueil") iconName = "home";
              else if (route.name === "Ajouter") iconName = "add-circle";
              else if (route.name === "Catégories") iconName = "list";
              else if (route.name === "Rapports") iconName = "stats-chart";
              else if (route.name === "Paramètres") iconName = "settings";
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#2196F3',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="Accueil" component={HomeScreen} />
          <Tab.Screen name="Ajouter" component={AddScreen} />
          <Tab.Screen name="Catégories" component={CategoriesScreen} />
          <Tab.Screen name="Rapports" component={ReportsScreen} />
          <Tab.Screen name="Paramètres" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </BudgetProvider>
  );
};
const HomeScreen = () => {
  const { transactions, getBalance, getIncomes, getExpenses } = React.useContext(BudgetContext);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Résumé du mois</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Revenus</Text>
            <Text style={[styles.summaryValue, styles.income]}>
              {getIncomes().toLocaleString()} FCFA
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Dépenses</Text>
            <Text style={[styles.summaryValue, styles.expense]}>
              {getExpenses().toLocaleString()} FCFA
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Solde</Text>
            <Text style={[styles.summaryValue, getBalance() >= 0 ? styles.income : styles.expense]}>
              {getBalance().toLocaleString()} FCFA
            </Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Dernières transactions</Text>
        <FlatList
          data={transactions.slice(-5)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <Text style={styles.transactionCategory}>{item.category}</Text>
              <Text style={[
                styles.transactionAmount,
                item.type === 'income' ? styles.income : styles.expense
              ]}>
                {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()} FCFA
              </Text>
            </View>
          )}
          scrollEnabled={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
};
const AddScreen = () => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const { addTransaction, categories } = React.useContext(BudgetContext);
  const handleSave = () => {
    // Validation
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert("Erreur", "Veuillez saisir un montant valide");
      return;
    }
    if (!category) {
      Alert.alert("Erreur", "Veuillez sélectionner une catégorie");
      return;
    }
    addTransaction({
      amount: parseFloat(amount),
      category,
      type,
      description
    });
    // Réinitialiser le formulaire
    setAmount("");
    setCategory("");
    setDescription("");
    Alert.alert("Succès", "Transaction ajoutée avec succès!");
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Ajouter une opération</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
            onPress={() => setType('expense')}
          >
            <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
              Dépense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
            onPress={() => setType('income')}
          >
            <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
              Revenu
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          placeholder="Montant (FCFA)"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
        />
        <Text style={styles.label}>Catégorie</Text>
        <FlatList
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryItem, category === item && styles.categoryItemSelected]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.categoryText, category === item && styles.categoryTextSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />
        <TextInput
          placeholder="Description (optionnel)"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          multiline
        />
        <Button title="Enregistrer" onPress={handleSave} />
      </ScrollView>
    </SafeAreaView>
  );
};
const CategoriesScreen = () => {
  const { categories } = React.useContext(BudgetContext);
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Gestion des catégories</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.categoryDisplayItem}>
            <Text style={styles.categoryDisplayText}>{item}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};
const ReportsScreen = () => {
  const { transactions, getIncomes, getExpenses } = React.useContext(BudgetContext);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Rapports</Text>
        <View style={styles.reportContainer}>
          <Text style={styles.reportTitle}>Statistiques</Text>
          <Text>Nombre de transactions: {transactions.length}</Text>
          <Text>Total revenus: {getIncomes().toLocaleString()} FCFA</Text>
          <Text>Total dépenses: {getExpenses().toLocaleString()} FCFA</Text>
        </View>
        <Text style={styles.sectionTitle}>Toutes les transactions</Text>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <View>
                <Text style={styles.transactionCategory}>{item.category}</Text>
                {item.description && <Text style={styles.transactionDescription}>{item.description}</Text>}
              </View>
              <Text style={[
                styles.transactionAmount,
                item.type === 'income' ? styles.income : styles.expense
              ]}>
                {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()} FCFA
              </Text>
            </View>
          )}
          scrollEnabled={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
};
const SettingsScreen = () => (
  <SafeAreaView style={styles.container}>
    <Text style={styles.title}>Paramètres</Text>
    <Text>Fonctionnalités à venir :</Text>
    <Text>• Sélection de la monnaie</Text>
    <Text>• Sécurité et mot de passe</Text>
    <Text>• Exportation des données</Text>
    <Text>• Sauvegarde cloud</Text>
  </SafeAreaView>
);
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#F44336',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  typeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    color: '#666',
  },
  typeButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  categoryItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  categoryItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  categoryText: {
    color: '#333',
  },
  categoryTextSelected: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  categoryDisplayItem: {
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  categoryDisplayText: {
    fontSize: 16,
    color: '#333',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
});
export default App;