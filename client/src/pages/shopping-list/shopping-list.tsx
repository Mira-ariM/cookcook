// 购物清单页
import { useState, useEffect } from 'react';
import { View, Text, Checkbox, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { getMealPlan } from '../../services/api';
import type { MealPlan } from '@shared/types';
import './shopping-list.scss';

export default function ShoppingList() {
  const router = useRouter();
  const planId = router.params.planId || '';
  const [plan, setPlan] = useState<MealPlan | null>(null);

  useEffect(() => {
    (async () => {
      const res = await getMealPlan(planId);
      if (res.data) setPlan(res.data);
    })();
  }, []);

  if (!plan) return <View className='page'><Text>加载中...</Text></View>;

  const { shoppingList } = plan;

  return (
    <View className='page'>
      <Text className='title'>🛒 购物清单</Text>

      {shoppingList.needToBuy.length > 0 && (
        <View className='section'>
          <Text className='section-title'>需要购买</Text>
          {shoppingList.needToBuy.map((item, i) => (
            <View key={i} className='item'>
              <Checkbox checked={item.checked} />
              <Text>{item.name} — {item.amount}</Text>
              <Text className='item-from'>（{item.fromRecipe}）</Text>
            </View>
          ))}
        </View>
      )}

      {shoppingList.alreadyHave.length > 0 && (
        <View className='section'>
          <Text className='section-title'>家里已有</Text>
          {shoppingList.alreadyHave.map((item, i) => (
            <View key={i} className='item done'>
              <Text>✅ {item.name} — {item.amount}</Text>
            </View>
          ))}
        </View>
      )}

      {shoppingList.optional.length > 0 && (
        <View className='section'>
          <Text className='section-title'>可选</Text>
          {shoppingList.optional.map((item, i) => (
            <View key={i} className='item'>
              <Text>{item.name} — {item.amount}</Text>
            </View>
          ))}
        </View>
      )}
      <Button className='start-btn' onClick={() => Taro.redirectTo({ url: `/pages/cooking/cooking?planId=${planId}` })}>
        🔪 开始做饭
      </Button>
    </View>
  );
}
