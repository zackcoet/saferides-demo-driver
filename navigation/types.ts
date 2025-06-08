export type RootStackParamList = {
  Home: undefined;
  Trips: undefined;
  Profile: undefined;
  RideDetails: {
    ride: {
      id: string;
      riderFirstName: string;
      riderLastName: string;
      pickup: string;
      dropoff: string;
      phoneNumber: string;
      status: 'accepted' | 'picked_up' | 'completed';
      riderCode?: string;
      pickupLocation?: {
        latitude: number;
        longitude: number;
      };
      dropoffLocation?: {
        latitude: number;
        longitude: number;
      };
    };
  };
  DropOffScreen: {
    rideId: string;
    dropoffAddress: string;
    pickupLocation?: {
      latitude: number;
      longitude: number;
    };
    dropoffLocation?: {
      latitude: number;
      longitude: number;
    };
  };
}; 