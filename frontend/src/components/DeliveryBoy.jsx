// Question: Delivery Boy Dashboard with Safe Socket Usage

import React, { useEffect, useState } from "react";
import Nav from "./Nav";
import axios from "axios";
import { serverUrl } from "../App";
import { useSelector } from "react-redux";
import { ClipLoader } from "react-spinners";
import DeliveryBoyTracking from "../components/DeliveryBoyTracking";
import { useSocket } from "../context/SocketContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function DeliveryBoy() {
  const { userData } = useSelector((state) => state.user);
  const socket = useSocket(); // ✅ safe socket

  const [currentOrder, setCurrentOrder] = useState(null);
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState(null);
  const [todayDeliveries, setTodayDeliveries] = useState([]);

  // 🔹 Send live location
  useEffect(() => {
    if (!socket || userData?.role !== "deliveryBoy") return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDeliveryBoyLocation({ lat: latitude, lon: longitude });

        socket.emit("updateLocation", {
          latitude,
          longitude,
          userId: userData._id
        });
      },
      console.error,
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket, userData]);

  // 🔹 Listen for new assignments
  useEffect(() => {
    if (!socket) return;

    socket.on("newAssignment", (data) => {
      setAvailableAssignments((prev) => [...prev, data]);
    });

    return () => socket.off("newAssignment");
  }, [socket]);

  // 🔹 API calls
  useEffect(() => {
    if (!userData) return;

    axios
      .get(`${serverUrl}/api/order/get-assignments`, { withCredentials: true })
      .then((res) => setAvailableAssignments(res.data));

    axios
      .get(`${serverUrl}/api/order/get-current-order`, { withCredentials: true })
      .then((res) => setCurrentOrder(res.data));

    axios
      .get(`${serverUrl}/api/order/get-today-deliveries`, { withCredentials: true })
      .then((res) => setTodayDeliveries(res.data));
  }, [userData]);

  const ratePerDelivery = 50;
  const totalEarning = todayDeliveries.reduce(
    (sum, d) => sum + d.count * ratePerDelivery,
    0
  );

  return (
    <div className="min-h-screen bg-[#fff9f6]">
      <Nav />
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-xl font-bold text-[#ff4d2d] mb-4">
          Welcome, {userData?.name}
        </h1>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={todayDeliveries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#ff4d2d" />
          </BarChart>
        </ResponsiveContainer>

        <p className="mt-4 text-center text-green-600 font-bold">
          Today Earning: ₹{totalEarning}
        </p>
      </div>
    </div>
  );
}

export default DeliveryBoy;
