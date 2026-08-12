import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AYYAPPA_JOURNEY } from '@/data/journeyCheckpoints';
import { useAppStore } from '@/store/useAppStore';
import { getCurrentDay } from '@/engines/deekshaEngine';
import { colors, spacing } from '@/theme/colors';
import { JourneyTrailMap } from '@/components/JourneyTrailMap';

export default function JourneyScreen() {
  const enrollment = useAppStore((s) => s.enrollment);
  const unlock = useAppStore((s) => s.unlockJourneyCheckpoint);
  if (!enrollment) return <View style={styles.empty}><Text style={styles.subtitle}>Start a Deeksha to view your journey.</Text></View>;
  const day = getCurrentDay(enrollment);
  const items = enrollment.deekshaId === 'ayyappa' ? AYYAPPA_JOURNEY : AYYAPPA_JOURNEY.slice(0, 6);
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.heading}>{enrollment.deekshaId === 'ayyappa' ? 'Your Sabarimala Journey' : 'Your Deeksha Journey'}</Text>
    <Text style={styles.subtitle}>A living trail shaped by your Deeksha status. Follow Guru and temple guidance at every milestone.</Text>
    <JourneyTrailMap checkpoints={items} currentDay={day} unlockedIds={enrollment.unlockedJourneyIds} />
    {items.map((item) => {
      const unlocked = enrollment.unlockedJourneyIds.includes(item.id) || (item.dayUnlock ?? Infinity) <= day;
      return <TouchableOpacity key={item.id} disabled={!unlocked} onPress={() => unlock(item.id)} style={[styles.card, unlocked && styles.unlocked]}>
        <Text style={styles.icon}>{unlocked ? item.icon : 'Locked'}</Text><View style={styles.copy}><Text style={styles.title}>{item.name}</Text><Text style={styles.description}>{unlocked ? item.description : `Available ${item.dayUnlock ? `on day ${item.dayUnlock}` : 'during pilgrimage'}`}</Text><Text style={styles.tag}>{item.category === 'OFFICIAL' ? 'Official guidance' : 'Traditional practice'}</Text></View>
      </TouchableOpacity>;
    })}
    <Text style={styles.note}>Traditional practices can vary by group, region and lineage.</Text>
  </ScrollView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.sm,paddingBottom:40},heading:{color:colors.text,fontSize:22,fontWeight:'700'},subtitle:{color:colors.textMuted,lineHeight:19},card:{flexDirection:'row',gap:spacing.md,padding:spacing.md,backgroundColor:colors.surface,borderRadius:14,borderWidth:1,borderColor:colors.border,opacity:.55},unlocked:{opacity:1,borderColor:colors.primary},icon:{fontSize:16,color:colors.primary,width:35},copy:{flex:1},title:{color:colors.text,fontSize:15,fontWeight:'600'},description:{color:colors.textMuted,fontSize:12,marginTop:5,lineHeight:17},tag:{color:colors.primary,fontSize:10,marginTop:7},note:{color:colors.textDim,fontSize:12,textAlign:'center',marginTop:spacing.md},empty:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background,padding:spacing.lg}});
