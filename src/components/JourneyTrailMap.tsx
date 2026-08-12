import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { JourneyCheckpoint } from '@/data/journeyCheckpoints';
import { colors } from '@/theme/colors';

type Props = { checkpoints: JourneyCheckpoint[]; currentDay: number; unlockedIds: string[] };
const stops = [{x:28,y:286},{x:92,y:240},{x:58,y:170},{x:142,y:128},{x:216,y:172},{x:196,y:82},{x:292,y:60},{x:320,y:142},{x:268,y:225},{x:334,y:286}];

export function JourneyTrailMap({ checkpoints, currentDay, unlockedIds }: Props) {
  const visible = checkpoints.slice(0, stops.length);
  return <View style={styles.frame}>
    <Svg width="100%" height={330} viewBox="0 0 360 330">
      <Rect width="360" height="330" rx="24" fill="#163229" />
      <Path d="M-10 272 C55 310 103 227 65 180 S74 91 142 130 S204 213 222 147 S190 39 274 58 S334 134 303 190 S261 271 346 286" fill="none" stroke="#E7BB4D" strokeWidth="20" strokeLinecap="round" />
      <Path d="M-10 272 C55 310 103 227 65 180 S74 91 142 130 S204 213 222 147 S190 39 274 58 S334 134 303 190 S261 271 346 286" fill="none" stroke="#433A1D" strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round" />
      <Path d="M15 80 C70 35 106 64 128 25" fill="none" stroke="#317C75" strokeWidth="23" strokeLinecap="round" opacity=".8" />
      <Path d="M250 256 C287 229 321 239 354 209" fill="none" stroke="#317C75" strokeWidth="18" strokeLinecap="round" opacity=".8" />
      {visible.map((checkpoint, index) => { const point=stops[index]; const unlocked=unlockedIds.includes(checkpoint.id)||(checkpoint.dayUnlock??Infinity)<=currentDay; const active=index===visible.filter((c)=>unlockedIds.includes(c.id)||(c.dayUnlock??Infinity)<=currentDay).length-1; return <Circle key={checkpoint.id} cx={point.x} cy={point.y} r={active?15:11} fill={unlocked?(active?colors.primary:'#F3D88B'):'#314B42'} stroke={unlocked?'#FFF7D6':'#577064'} strokeWidth={active?4:2} />; })}
    </Svg>
    {visible.map((checkpoint,index)=><View key={checkpoint.id} style={[styles.label,{left:`${(stops[index].x/360)*100}%`,top:stops[index].y+14}]}><Text numberOfLines={1} style={styles.labelText}>{checkpoint.name.replace('Day ','D')}</Text></View>)}
    <View style={styles.legend}><View style={styles.legendDot}/><Text style={styles.legendText}>Your progress</Text><Text style={styles.legendMuted}>Trail adapts to your Deeksha day</Text></View>
  </View>;
}
const styles=StyleSheet.create({frame:{height:330,borderRadius:24,overflow:'hidden',position:'relative',backgroundColor:'#163229'},label:{position:'absolute',width:88,marginLeft:-44,alignItems:'center'},labelText:{color:'#F8F2D7',fontSize:9,fontWeight:'700',textAlign:'center'},legend:{position:'absolute',right:12,top:12,backgroundColor:'#10261FDD',borderRadius:12,padding:9,gap:3},legendDot:{width:9,height:9,borderRadius:9,backgroundColor:colors.primary},legendText:{color:'#F8F2D7',fontSize:10,fontWeight:'700'},legendMuted:{color:'#B9C8BF',fontSize:9,maxWidth:105}});
