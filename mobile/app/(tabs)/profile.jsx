import { View, Text, TouchableOpacity, Alert, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { useAuthStore } from '../../store/authStore'
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import styles from '../../assets/styles/profile.styles';
import ProfileHeader from '../../components/ProfileHeader';
import LogoutButton from '../../components/LogoutButton';
import { API_URI } from '../../constants/api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import COLORS from '../../constants/colors';
import { sleep } from '.';
import Loader from '../../components/Loader';

export default function Profile() {
  const { token } = useAuthStore();

  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteBookId, setDeleteBookId] = useState(null);

  const router = useRouter();

  const fetchData = async () =>{
    try {
      setIsLoading(true);

      const response = await fetch(`${API_URI}/books/user`,{
        headers: {Authorization: `Bearer ${token}`},
      });

      const data = await response.json();
      if(!response.ok) throw new Error(data.message || "Failed to fetch user books");

      setBooks(data);
    } catch (error) {
      console.log("Error fetching user books", error);
      Alert.alert("Error", "Failed to load profile data. Pull down to refresh.");
    }finally{
      setIsLoading(false);
    }
  };

  useEffect(()=>{
    fetchData();
  }, []);

  const handleDeleteBook = async(bookId) =>{
    try {
      setDeleteBookId(bookId);
      const response = await fetch(`${API_URI}/books/${bookId}`,{
        method:"DELETE",
        headers: {Authorization: `Bearer ${token}`},
      });

      const data = await response.json();
      if(!response.ok) throw new Error(data.message || "Failed to delete book");

      setBooks(books.filter((book) => book._id !== bookId));
      Alert.alert("Success", "Recommendation deleted successfully!");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to delete recommendation");
    }finally{
      setDeleteBookId(null);
    }
  }

  const confirmDelete = (bookId) =>{
    Alert.alert("Delete Recommendation", "Are you sure you want to delet this recommendation?", [
      { text: "Cancel", style: "cancel"},
      { text: "Delete", onPress: () => handleDeleteBook(bookId), style: "destructive" }
    ]);
  };

  const renderBookItem = ({ item }) =>(
    <View style={styles.bookItem}>
      <Image source={item.image} style={styles.bookImage}/>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <View style={styles.ratingContainer}>{renderRatingStars(item.rating)}</View>
        <Text style={styles.bookCaption} numberOfLines={2} ellipsizeMode="tail">{item.caption}</Text>
        <Text style={styles.bookDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={()=> {confirmDelete(item._id)}}>
        {deleteBookId === item._id ?(
          <ActivityIndicator size="small" color={COLORS.primary}/>
        ) : (
          <Ionicons name="trash-outline" size={20} color={COLORS.primary}/> 
        )}
      </TouchableOpacity>
    </View>
  );

  const renderRatingStars = (rating) =>{
    const stars = [];
    for(let i = 1; i<=5; i++){
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star": "star-outline"}
          size={16}
          color={i <= rating ? "#f4b400": COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  const handleRefresh = async() =>{
    setRefreshing(true);
    await sleep(500);
    await fetchData();
    setRefreshing(false);
  }

  if(isLoading && !refreshing) return <Loader/>;
  
  return (
    <View style={styles.container}>
      <ProfileHeader/>
      <LogoutButton/>

      <View style={styles.booksHeader}>
        <Text style={styles.booksTitle}>Your Recommendations 📚</Text>
        <Text style={styles.booksCount}>{books.length} books</Text>
      </View>

      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={()=> handleRefresh()}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name='book-outline' size={50} color={COLORS.textSecondary}/>
            <Text style={styles.emptyText}>No recommendations yet</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create")}>
              <Text style={styles.addButtonText}>Add your first book</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}