// 情侣档案页 — 简化版 P0
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { createProfile } from '../../services/api';
import './profile.scss';

export default function Profile() {
  const handleCreate = async () => {
    try {
      const res = await createProfile({
        partnerA: {
          name: '我', role: 'self',
          likedFlavors: [], dislikedFlavors: [],
          allergies: [], dietaryRestrictions: [], recentAversions: [],
          cookingSkill: 2, cookingPatience: 2, isPrimaryCook: true,
        },
        partnerB: {
          name: '对方', role: 'partner',
          likedFlavors: [], dislikedFlavors: [],
          allergies: [], dietaryRestrictions: [], recentAversions: [],
          cookingSkill: 2, cookingPatience: 2, isPrimaryCook: false,
        },
      });
      Taro.setStorageSync('profileId', res.data?.id);
      Taro.showToast({ title: '档案已创建', icon: 'success' });
    } catch (e: any) {
      Taro.showToast({ title: e.message, icon: 'none' });
    }
  };

  return (
    <View className='page'>
      <Text className='title'>💑 情侣档案</Text>
      <Text className='desc'>P0 简版：创建空白档案即可开始搭饭。</Text>
      <Button className='create-btn' onClick={handleCreate}>创建档案</Button>
    </View>
  );
}
