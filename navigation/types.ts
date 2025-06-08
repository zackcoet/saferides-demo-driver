export type RootStackParamList = {
  Home: undefined;
  Trips: undefined;
  Profile: undefined;
  RideDetails: {
    ride: {
      id: string;
      riderId: string;
      pickupAddress?: string;
      pickupLocation?: {
        latitude: number;
        longitude: number;
      };
      riderName?: string;
      riderPhone?: string;
      riderGender?: string;
      status: 'accepted' | 'picked_up' | 'completed';
      riderCode?: string;
    };
  };
  DropOffScreen: {
    rideId: string;
    pickupLocation: {
      latitude: number;
      longitude: number;
    };
    dropoffLocation?: {
      latitude: number;
      longitude: number;
    };
    dropoffAddress?: string;
  };
  RideDetailsScreen: {
    ride: {
      id: string;
      riderId: string;
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
      driverId?: string;
      driverName?: string;
      driverPhone?: string;
      driverGender?: string;
      driverCar?: {
        make: string;
        model: string;
        color: string;
        year: string;
      };
      driverPlate?: string;
    };
  };
}; 