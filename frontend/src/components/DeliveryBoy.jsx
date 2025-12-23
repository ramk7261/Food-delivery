import React, { useEffect, useState } from 'react'
import Nav from './Nav'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { serverUrl } from '../App'
import DeliveryBoyTracking from './DeliveryBoyTracking'
import { ClipLoader } from 'react-spinners'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

function DeliveryBoy() {
  const { userData, socket } = useSelector(state => state.user)

  const [currentOrder, setCurrentOrder] = useState(null)
  const [showOtpBox, setShowOtpBox] = useState(false)
  const [availableAssignments, setAvailableAssignments] = useState([])
  const [otp, setOtp] = useState("")
  const [todayDeliveries, setTodayDeliveries] = useState([])
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  /* ================= GEO LOCATION ================= */
  useEffect(() => {
    if (!socket || !userData || userData.role !== "deliveryBoy") return

    let watchId

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const latitude = position.coords.latitude
          const longitude = position.coords.longitude

          setDeliveryBoyLocation({ lat: latitude, lon: longitude })

          socket.emit("updateLocation", {
            latitude,
            longitude,
            userId: userData._id
          })
        },
        (error) => console.log(error),
        { enableHighAccuracy: true }
      )
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
    }
  }, [socket, userData])

  /* ================= SOCKET LISTENER ================= */
  useEffect(() => {
    if (!socket) return

    const handleNewAssignment = (data) => {
      setAvailableAssignments(prev => [...prev, data])
    }

    socket.on("newAssignment", handleNewAssignment)

    return () => {
      socket.off("newAssignment", handleNewAssignment)
    }
  }, [socket])

  /* ================= API CALLS ================= */
  const getAssignments = async () => {
    try {
      const res = await axios.get(
        `${serverUrl}/api/order/get-assignments`,
        { withCredentials: true }
      )
      setAvailableAssignments(res.data || [])
    } catch (err) {
      console.log(err)
    }
  }

  const getCurrentOrder = async () => {
    try {
      const res = await axios.get(
        `${serverUrl}/api/order/get-current-order`,
        { withCredentials: true }
      )
      setCurrentOrder(res.data || null)
    } catch (err) {
      console.log(err)
    }
  }

  const handleTodayDeliveries = async () => {
    try {
      const res = await axios.get(
        `${serverUrl}/api/order/get-today-deliveries`,
        { withCredentials: true }
      )
      setTodayDeliveries(res.data || [])
    } catch (err) {
      console.log(err)
    }
  }

  const acceptOrder = async (assignmentId) => {
    try {
      await axios.get(
        `${serverUrl}/api/order/accept-order/${assignmentId}`,
        { withCredentials: true }
      )
      getCurrentOrder()
    } catch (err) {
      console.log(err)
    }
  }

  const sendOtp = async () => {
    if (!currentOrder) return
    setLoading(true)
    try {
      await axios.post(
        `${serverUrl}/api/order/send-delivery-otp`,
        {
          orderId: currentOrder._id,
          shopOrderId: currentOrder.shopOrder._id
        },
        { withCredentials: true }
      )
      setShowOtpBox(true)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    try {
      const res = await axios.post(
        `${serverUrl}/api/order/verify-delivery-otp`,
        {
          orderId: currentOrder._id,
          shopOrderId: currentOrder.shopOrder._id,
          otp
        },
        { withCredentials: true }
      )
      setMessage(res.data.message)
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    if (!userData) return
    getAssignments()
    getCurrentOrder()
    handleTodayDeliveries()
  }, [userData])

  /* ================= CALCULATIONS ================= */
  const ratePerDelivery = 50
  const totalEarning = todayDeliveries.reduce(
    (sum, d) => sum + d.count * ratePerDelivery,
    0
  )

  /* ================= UI ================= */
  return (
    <div className="w-screen min-h-screen flex flex-col items-center bg-[#fff9f6]">
      <Nav />

      <div className="w-full max-w-[800px] flex flex-col gap-5 items-center">

        <div className="bg-white rounded-2xl shadow-md p-5 w-[90%] text-center">
          <h1 className="text-xl font-bold text-orange-500">
            Welcome, {userData?.fullName}
          </h1>
          {deliveryBoyLocation && (
            <p className="text-sm">
              Lat: {deliveryBoyLocation.lat} | Lon: {deliveryBoyLocation.lon}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 w-[90%]">
          <h2 className="font-bold mb-2">Today Deliveries</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={todayDeliveries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#ff4d2d" />
            </BarChart>
          </ResponsiveContainer>

          <p className="mt-4 text-center text-xl font-bold text-green-600">
            ₹{totalEarning}
          </p>
        </div>

        {!currentOrder && (
          <div className="bg-white rounded-2xl shadow-md p-5 w-[90%]">
            <h2 className="font-bold mb-3">Available Orders</h2>
            {availableAssignments.length === 0 && (
              <p>No orders available</p>
            )}

            {availableAssignments.map((a, i) => (
              <div key={i} className="border p-3 rounded flex justify-between">
                <div>
                  <p className="font-semibold">{a.shopName}</p>
                  <p className="text-xs">{a.deliveryAddress.text}</p>
                </div>
                <button
                  className="bg-orange-500 text-white px-3 rounded"
                  onClick={() => acceptOrder(a.assignmentId)}
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        )}

        {currentOrder && (
          <div className="bg-white rounded-2xl shadow-md p-5 w-[90%]">
            <DeliveryBoyTracking
              data={{
                deliveryBoyLocation,
                customerLocation: {
                  lat: currentOrder.deliveryAddress.latitude,
                  lon: currentOrder.deliveryAddress.longitude
                }
              }}
            />

            {!showOtpBox ? (
              <button
                onClick={sendOtp}
                className="mt-4 w-full bg-green-500 text-white py-2 rounded"
              >
                {loading ? <ClipLoader size={20} color="white" /> : "Mark Delivered"}
              </button>
            ) : (
              <>
                <input
                  className="w-full border p-2 mt-3"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                />
                <button
                  onClick={verifyOtp}
                  className="mt-2 w-full bg-orange-500 text-white py-2 rounded"
                >
                  Verify OTP
                </button>
                {message && <p className="text-green-600">{message}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryBoy
