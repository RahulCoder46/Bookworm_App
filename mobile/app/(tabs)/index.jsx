import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useAuthStore } from '../../store/authStore';
import { useCallback, useEffect, useState } from 'react';

import styles from '../../assets/styles/home.styles';
import { API_URI } from '../../constants/api';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';
import { formatPublishDate } from '../../lib/utils';
import { useFocusEffect } from 'expo-router';
import Loader from '../../components/Loader';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export default function Home() {
  const {token} = useAuthStore();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBooks = async (pageNum = 1, refresh = false) =>{
    try {
      if(refresh) setRefreshing(true);
      else if(pageNum === 1) setLoading(true);

      const response = await fetch(`${API_URI}/books?page=${pageNum}&limit=2`,{
        headers: {Authorization: `Bearer ${token}`},
      });

      const data = await response.json();
      if(!response.ok) throw new Error(data.message || "Failed to fetch books");

      // setBooks((prevBooks)=> [...prevBooks, ...data.books]);

      const uniqueBooks = refresh || pageNum === 1 
        ? data.books: Array.from(new Set([...books, ...data.books].map((book)=> book._id)))
        .map((id) => [...books, ...data.books]
        .find((book)=> book._id  === id));

      setBooks(uniqueBooks);
      // setBooks(prevBooks => {
      //   if (refresh || pageNum === 1) return data.books;

      //   const merged = [...prevBooks, ...data.books];
      //   return merged.filter(
      //     (book, index, self) =>
      //       index === self.findIndex(b => b._id === book._id)
      //   );
      // });
      setHasMore(pageNum < data.totalPages);
      setPage(pageNum);
      if(refresh) {
        await sleep(800);
        setRefreshing(false);
      }
      else setLoading(false);
    } catch (error) {
      console.log("Error fetching books", error);
    }finally{
      if(refresh) {
        await sleep(800);
        setRefreshing(false);
      }
      else setLoading(false);
    }
  };
  useEffect(()=>{
    fetchBooks();
  }, []);
  // useFocusEffect(
  //   useCallback(() => {
  //     fetchBooks(1, true); // refresh list when coming back
  //   }, [])
  // );

  const handleLoadMore = async () =>{
    if(hasMore && !refreshing && !loading){
      await fetchBooks(page + 1);
    }
  };
  // const handleLoadMore = () => {
  //   setPage(prevPage => {
  //     const nextPage = prevPage + 1;
  //     // sleep(1000);
  //     fetchBooks(nextPage);
  //     return nextPage;
  //   });
  // };

  const renderItem = ({item}) =>{
    return (
      <View style={styles.bookCard}>
        <View style={styles.bookHeader}>
          <View style={styles.userInfo}>
            <Image source={{uri: item.user.profileImage}} style={styles.avatar}/>
            <Text style={styles.username}>{item.user.username}</Text>
          </View>
        </View>

        <View style={styles.bookImageContainer}>
          <Image source={item.image} style={styles.bookImage} contentFit='cover'/>
        </View>

        <View style={styles.bookDetails}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          <View style={styles.ratingContainer}>{renderRatingStars(item.rating)}</View>
          <Text style={styles.caption}>{item.caption}</Text>
          <Text style={styles.date}>Shared on {formatPublishDate(item.createdAt)}</Text>
        </View>
      </View>
    );
  };
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

  if(loading) return <Loader size="large"/>;

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={()=> fetchBooks(1, true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>BookWorm 📚🐛</Text>
            <Text style={styles.headerSubtitle}>Discover great reads from the community👇</Text>
          </View>
        }
        ListFooterComponent={
          hasMore && books.length > 0 ? (
            <ActivityIndicator style={styles.footerLoader} size="small" color={COLORS.primary}/>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name='book-outline' size={60} color={COLORS.textSecondary}/>
            <Text style={styles.emptyText}>No recommendations yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share a book!</Text>
          </View>
        }
      />
    </View>
  )
}