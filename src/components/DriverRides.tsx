import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Check, X as XIcon, RefreshCw } from "lucide-react";
import GoogleMap from "@/components/GoogleMap";
import { useAuth } from "@/hooks/useAuth";
import { SystemLogs } from "@/utils/systemLogs";
import { rideService } from "@/services/rideService";
import { RideRequest } from "@/types";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface RideStats {
  totalRides: number;
  completedRides: number;
  rejectedRides: number;
  acceptanceRate: number;
  averageRating: number;
}

const DriverRides = () => {
  const [pendingRides, setPendingRides] = useState<RideRequest[]>([]);
  const [stats, setStats] = useState<RideStats>({
    totalRides: 0,
    completedRides: 0,
    rejectedRides: 0,
    acceptanceRate: 0,
    averageRating: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);

  const loadPendingRides = async () => {
    try {
      if (!user?.id) return;
      // Fetch both pending rides (unassigned) and accepted rides assigned to this driver
      const { data: rides, error } = await supabase
        .from('ride_requests')
        .select('*')
        .or(`status.eq.pending,status.eq.accepted`)
        .or(`driver_id.is.null,driver_id.eq.${user.id}`);
      if (error) throw error;
      setPendingRides(rides || []);
    } catch (error) {
      console.error("Error loading pending rides:", error);
      toast({
        title: "Error",
        description: "Failed to load pending rides. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculateStats = async () => {
    if (!user?.id) return;
    try {
      const newStats = await rideService.getRideStats(user.id);
      console.log("Calculated stats:", newStats);
      setStats(newStats);
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPendingRides();
    calculateStats();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    if (user?.id) {
      loadPendingRides();
      calculateStats();
      const interval = setInterval(() => {
        loadPendingRides();
        calculateStats();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const handleAcceptRide = async (ride: RideRequest) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to accept rides.",
        variant: "destructive",
      });
      return;
    }

    // Get driver's current location
    navigator.geolocation.getCurrentPosition(async (position) => {
      const driverLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const driverInfo = {
        phone: user.phone,
        email: user.email,
      };
      try {
        const success = await rideService.acceptRide(ride.id!, user.id, driverLocation, driverInfo);
        if (success) {
          setPendingRides(prev => prev.filter(r => r.id !== ride.id));
          calculateStats();
          setActiveRideId(ride.id!);
          SystemLogs.addLog(
            "Ride accepted",
            `Driver ${user.first_name} ${user.last_name} accepted ride from ${ride.pickup_location} to ${ride.destination}`,
            user.id,
            user.role
          );
          toast({
            title: "Ride accepted!",
            description: "You have accepted this ride request.",
          });
          // Start periodic location updates
          if (locationUpdateInterval.current) clearInterval(locationUpdateInterval.current);
          locationUpdateInterval.current = setInterval(async () => {
            navigator.geolocation.getCurrentPosition(async (pos) => {
              const newLocation = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              };
              await supabase
                .from('ride_requests')
                .update({ driver_location: newLocation, updated_at: new Date().toISOString() })
                .eq('id', ride.id);
            });
          }, 30000); // 30 seconds
        } else {
          throw new Error("Failed to accept ride");
        }
      } catch (error) {
        console.error("Error accepting ride:", error);
        toast({
          title: "Error",
          description: "Failed to accept ride. Please try again.",
          variant: "destructive",
        });
      }
    }, (error) => {
      toast({
        title: "Location Error",
        description: "Could not get your location. Please enable location services and try again.",
        variant: "destructive",
      });
    });
  };

  const handleRejectRide = async (ride: RideRequest) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to reject rides.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await rideService.rejectRide(ride.id!, user.id);

      if (success) {
        setPendingRides(prev => prev.filter(r => r.id !== ride.id));
        calculateStats();

        SystemLogs.addLog(
          "Ride rejected",
          `Driver ${user.first_name} ${user.last_name} rejected ride from ${ride.pickup_location} to ${ride.destination}`,
          user.id,
          user.role
        );

        toast({
          title: "Ride rejected",
          description: "You have rejected this ride request.",
        });
        // Clear location update interval if this was the active ride
        if (activeRideId === ride.id && locationUpdateInterval.current) {
          clearInterval(locationUpdateInterval.current);
          locationUpdateInterval.current = null;
          setActiveRideId(null);
        }
      } else {
        throw new Error("Failed to reject ride");
      }
    } catch (error) {
      console.error("Error rejecting ride:", error);
      toast({
        title: "Error",
        description: "Failed to reject ride. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteRide = async (ride: RideRequest) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to complete rides.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', ride.id)
        .eq('driver_id', user.id);

      if (error) throw error;

      setPendingRides(prev => prev.filter(r => r.id !== ride.id));
      calculateStats();

      SystemLogs.addLog(
        "Ride completed",
        `Driver ${user.first_name} ${user.last_name} completed ride from ${ride.pickup_location} to ${ride.destination}`,
        user.id,
        user.role
      );

      toast({
        title: "Ride completed!",
        description: "The ride has been marked as completed.",
      });
      // Clear location update interval
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
        locationUpdateInterval.current = null;
        setActiveRideId(null);
      }
    } catch (error) {
      console.error("Error completing ride:", error);
      toast({
        title: "Error",
        description: "Failed to complete ride. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view driver dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">You need to be logged in as a driver to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4">
          <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
            <div className="text-xl font-bold">DRIVER STATISTICS</div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-blue-600"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Rides</div>
              <div className="text-2xl font-bold">{stats.totalRides}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
              <div className="text-2xl font-bold">{stats.completedRides}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Rejected</div>
              <div className="text-2xl font-bold">{stats.rejectedRides}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Acceptance Rate</div>
              <div className="text-2xl font-bold">{stats.acceptanceRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
            <div className="text-xl font-bold">AVAILABLE RIDES</div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-blue-600"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="p-4">
            {pendingRides.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending ride requests
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRides.map((ride) => (
                  <div key={ride.id} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <MapPin size={18} className="text-blue-500" />
                          <span className="text-sm font-medium">{ride.pickup_location}</span>
                        </div>
                      </div>
                      
                      <div className="border-l-2 border-dashed border-gray-300 dark:border-gray-600 h-6 ml-[9px]"></div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <MapPin size={18} className="text-red-500" />
                          <span className="text-sm font-medium">{ride.destination}</span>
                        </div>
                      </div>

                      <GoogleMap
                        pickupLocation={ride.pickup_location}
                        destination={ride.destination}
                        onRouteCalculated={() => {}}
                      />
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Clock size={18} />
                          <span className="text-sm font-medium">Estimated time</span>
                        </div>
                        <span className="text-sm font-bold">{ride.estimatedTime || "Calculating..."}</span>
                      </div>
                      
                      {ride.status === 'pending' ? (
                        <div className="flex gap-4">
                          <Button 
                            className="flex-1" 
                            variant="outline"
                            onClick={() => handleRejectRide(ride)}
                          >
                            <XIcon className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                          <Button 
                            className="flex-1"
                            onClick={() => handleAcceptRide(ride)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Accept
                          </Button>
                        </div>
                      ) : ride.status === 'accepted' && ride.driver_id === user?.id ? (
                        <div className="flex gap-4">
                          <Button 
                            className="flex-1"
                            onClick={() => handleCompleteRide(ride)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Complete Ride
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={loadPendingRides}>
                Refresh Requests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverRides;

