import { useState } from 'react';

import ClosetHomeScreen from './ClosetHomeScreen';
import GarmentClassificationScreen from '@/features/garmentClassification/screens/GarmentClassificationScreen';

export default function HomeTabScreen() {
  const [addingPiece, setAddingPiece] = useState(false);

  return addingPiece ? (
    <GarmentClassificationScreen onBack={() => setAddingPiece(false)} />
  ) : (
    <ClosetHomeScreen onAddPiece={() => setAddingPiece(true)} />
  );
}
