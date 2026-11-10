import { useState } from 'react';

import ClosetHomeScreen from './ClosetHomeScreen';
import GarmentClassificationScreen from '@/features/garmentClassification/screens/GarmentClassificationScreen';

export default function HomeTabScreen() {
  const [addingPiece, setAddingPiece] = useState(false);

  if (addingPiece) {
    return <GarmentClassificationScreen onBack={() => setAddingPiece(false)} />;
  }

  return <ClosetHomeScreen onAddPiece={() => setAddingPiece(true)} />;
}
