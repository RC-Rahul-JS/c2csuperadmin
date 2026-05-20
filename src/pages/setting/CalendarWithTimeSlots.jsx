import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useNavigate, Link,useParams } from "react-router";
import Cookies from 'js-cookie';
import Swal from 'sweetalert2'
import axios from "axios";
import moment from "moment";
const CalendarWithTimeSlots = () => {

  const BASE_API_URL = import.meta.env.VITE_API_URL;
  
const {id}=useParams()
    const USER_ID = id
  // const BASE_API_URL = 'https://api.care2connect.in';

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDay, setSelectedDay] = useState(dayjs().date()); // Default to today's date
  const [bookedSlots, setBookedSlots] = useState({});
  const [bookedSlots2, setBookedSlots2] = useState({});
  
  // Time slots (customize as needed)
  const [timeSlots, settimeSlots] = useState([]);
  const navigate=useNavigate()
  // Max bookings per slot
  const maxBookings = 5;

  // Get month details
  const startOfMonth = currentMonth.startOf("month").day();
  const daysInMonth = currentMonth.daysInMonth();
  const monthYear = currentMonth.format("MMMM YYYY");

  // Generate days for the calendar
  const days = Array.from({ length: startOfMonth }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );
  const [slotsArray, setslotsArray] = useState({})
  // const [appointments, setappointments] = useState([])

  useEffect(() => {
    const fetch=async()=>{

         try {
                let res = await axios.get(
                    `${BASE_API_URL}/get_appointments/${currentMonth.format("YYYY-MM")}-${String(selectedDay).padStart(2, "0")}/${Cookies.get('user')}`,
                    
                
                );


          



    //   let res = await postData("/get_appointment", {});
      let list=res.data.filter((item) => item.status === "success")
      // setappointments(list)
      if (!selectedDay) return; // Ensure date is provided
    let today=`${currentMonth.format("YYYY-MM")}-${String(selectedDay).padStart(2, "0")}`
    let list2=list.filter(item=>item.date_of_appointment === today)
    if(list2){
      console.log(list2)
      const uniqueArray = list2.reduce((acc, item) => {
        acc[item.time_slot] = (acc[item.time_slot] || 0) + 1;
        return acc;
      }, []);

      const groupedByTimeSlot = list2.reduce((acc, item) => {
        if (!acc[item.time_slot]) {
          acc[item.time_slot] = [];
        }
        acc[item.time_slot].push(item);
        return acc;
      }, {});
      // console.log(groupedByTimeSlot)

      // const data = {};

      // list2.forEach(item => {
      //   if (!data[item.timeSlot]) {
      //     data[item.timeSlot] = []; // create new array for slot
      //   }
      //   data[item.timeSlot].push(item); // push object to slot array
      // });
      // console.log(data)


      let obj={[today]:{...uniqueArray}}
      setBookedSlots(obj)
      setBookedSlots2(groupedByTimeSlot)
      console.log(obj);
      // setAppointments(dataArray);
    } else {
      console.log("No appointments found for this date");
    }



      } catch (error) {
                console.error("Error fetching user profile:", error);
            }


    }
    fetch()


    
  }, [selectedDay]);


  useEffect(() => {
    const fetchAppointments = async () => {


         try {
                let res = await axios.post(
                    `${BASE_API_URL}/get_profile/${USER_ID}/`,
                    {}, {
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": "1234",
                    },
                }
                );

             settimeSlots(res.data.slots.slotsvalue)
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }

          console.log("slots value")
    }
    fetchAppointments();
  }, []);

  const fetchenableslots = async () => {

     try {
                let res = await axios.post(
                    `${BASE_API_URL}/get_slot/${USER_ID}`,
                    {}, {
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": "1234",
                    },
                }
                );

                setslotsArray(res.data)

            } catch (error) {
                console.error("Error fetching user profile:", error);
            }

  }
  useEffect(() => {
    fetchenableslots();
  }, []);


  function convertTo12Hour(time) {
    let [hours, minutes] = time.split(":").map(Number);
    let period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert 0 or 12 to 12, otherwise take the remainder
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
}


const waitwatch=async(w)=>{
      const accessToken = 'EACHqNPEWKbkBO33utbtE1EMW5T1B8KlYqSpLDepuZCdrEY9unIfGmwnlZB4XgfEFQw2ohjGAAoBL1OHY08kftSW0ZBEvX5eXIodrY2gghys3IEoyoKwZCvHh0ZBd7I6eB9ttTEV1fsghWvpzycfIr5pIVIeftLpO0jlFLp9FZB31dd48QZCzmYSxSvKuIFkZAOlchwZDZD'; // Replace with your token
  const phoneNumberId = '563776386825270'; // Replace with your number ID

const payload = {
          messaging_product: "whatsapp",
          to: w,
          type: "text",
          text: { body: `We regret to inform you that your appointment scheduled for ${'--'} at ${'--'} has been cancelled due to unforeseen emergency circumstances.

We sincerely apologize for any inconvenience this may cause.

Please be assured that your consultation fee will be refunded shortly.

Thank you for your understanding.` },
        };

        await axios.post(
          `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
}


const sendbroadcart=async(data)=>{
  for (let i = 0; i < data.length; i++) {
    const element = data[i];
    console.log(element)

    // const dd = waitwatch(element.whatsapp_number)

     const accessToken = 'EACHqNPEWKbkBO33utbtE1EMW5T1B8KlYqSpLDepuZCdrEY9unIfGmwnlZB4XgfEFQw2ohjGAAoBL1OHY08kftSW0ZBEvX5eXIodrY2gghys3IEoyoKwZCvHh0ZBd7I6eB9ttTEV1fsghWvpzycfIr5pIVIeftLpO0jlFLp9FZB31dd48QZCzmYSxSvKuIFkZAOlchwZDZD'; // Replace with your token
  const phoneNumberId = '563776386825270'; // Replace with your number ID


  const payload={
  "messaging_product": "whatsapp",
  "to": element.whatsapp_number,
  "type": "template",
  "template": {
    "name": "cancel_ap",
    "language": {
      "code": "en"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": element.date_of_appointment  // Example: "Indrajeet"
          },
          {
            "type": "text",
            "text": element.time_slot  // Example: "123456"
          }
        ]
      }
    ]
  }
}


const payload1 = {
          messaging_product: "whatsapp",
          to: element.whatsapp_number,
          type: "text",
          text: { body: `We regret to inform you that your appointment scheduled for ${element.date_of_appointment} at ${element.time_slot} has been cancelled due to unforeseen emergency circumstances.

We sincerely apologize for any inconvenience this may cause.

Please be assured that your consultation fee will be refunded shortly.

Thank you for your understanding.` },
        };

        const kk = await axios.post(
          `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(kk)
  }
}

  const setData=(date,slot,enable)=>{
    sendbroadcart(bookedSlots2[slot])
         Swal.fire({
              title: "Are you sure?",
              text: "You want to Disable the Slot!",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#d33",
              confirmButtonText: "Yes, Disable!"
            }).then(async(result) => {
              if (result.isConfirmed) {
                 try {
                let res = await axios.post(
                    `${BASE_API_URL}/slot_disable_k/${USER_ID}`,
                    {date,slot,enable}, {
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": "1234",
                    },
                }
                );
                 Swal.fire({
                    title: "Updated!",
                    text: "Your file has been Updated.",
                    icon: "success"
                  }); 

                  fetchenableslots()

            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
              }
            });

  }


  return (
    <>
    <div style={{ maxWidth: "350px", margin: "20px auto", fontFamily: "Arial, sans-serif", textAlign: "center", border: "1px solid #ddd", borderRadius: "8px", padding: "10px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px",color:"#075e54" }}>
        <button onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))} style={{ background: "#ddd",color:"black",fontWeight:"bold", border: "none", padding: "5px 10px", cursor: "pointer", fontSize: "16px", borderRadius: "5px" }}>
          &lt;
        </button>
        <h2 style={{ margin: "0" ,fontSize:14}}>{monthYear}</h2>
        <button onClick={() => setCurrentMonth(currentMonth.add(1, "month"))} style={{ background: "#ddd",color:"black", border: "none",fontWeight:"bold", padding: "5px 10px", cursor: "pointer", fontSize: "16px", borderRadius: "5px" }}>
          &gt;
        </button>
      </div>

      {/* Days of the week */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px", padding: "10px", fontWeight: "bold" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} style={{color:'white', padding: "5px", border: "1px solid #ddd",background:"#075e54",fontSize:12 }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px", padding: "10px" }}>
        {days.map((day, index) => (
          <div
            key={index}
            style={{
              fontSize:12,
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #ddd",
              cursor: day ? "pointer" : "default",
              background: selectedDay === day ? "#4ABAB3" : "white",
              color: selectedDay === day ? "white" : "black",
              fontWeight: selectedDay === day ? "bold" : "normal",
            }}
            onClick={() => setSelectedDay(day)}
          >
            {day}
          </div>
        ))}
      </div>

      <div>
      {/* Time Slots */}
      {selectedDay && (
        <div style={{ marginTop: "20px", textAlign: "center",color:"black" }}>
          <h3 style={{fontSize:12}}>Booked Slots for {selectedDay} {monthYear}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginTop: "10px" }}>
          {timeSlots.length > 0 && timeSlots.map((item,index) => {
              const end = convertTo12Hour(item.slot.etime);
              const start = convertTo12Hour(item.slot.stime);
              const key = `${currentMonth.format("YYYY-MM")}-${String(selectedDay).padStart(2, "0")}`;
              const bookings = bookedSlots[key]?.[`${start} - ${end}`] || 0;
              const isFullyBooked = bookings >= item.maxno;
              const isEnabled = Array.isArray(slotsArray)
                                ? (slotsArray.find(item => item.slot === `${start} - ${end}` && item.date === key)?.enable ?? true)
                                : true;
              const backgroundColor = !isEnabled
                ? "#D3D3D3" // Red for disabled
                : isFullyBooked
                ? "#DC5757" // Red for fully booked
                : "#4ABA9B"; // Green if available
                
              const handleToggle =() => {
                // if(bookings===0){
                  setData(key,`${start} - ${end}`,!isEnabled)
                // }
              };

              return (
                <div
                  key={item.slot.stime}
                  style={{
                    padding: "10px",
                    borderRadius: "5px",
                    cursor: bookings!==0||!isEnabled ? "not-allowed" : "pointer",
                    background: backgroundColor,
                    color: !isEnabled?"#6B6B6B":"white",
                    fontWeight: "bold",
                    fontSize: 12
                  }}
                  onClick={()=>isEnabled&&handleToggle()}
                >
                  {`${start}-${end}`} ({bookings}/{item.maxno})
                </div>
              );
            })}

          </div>
        </div>
      )}
       <div style={{fontSize:10,width:300,marginTop:20}}>
        <label style={{display:'flex',alignItems:'center'}}><div style={{width:10,height:10,background:'grey',marginRight:5}}></div> Disable Slots are defined by grey colour.</label>
        <label style={{display:'flex',alignItems:'center'}}><div style={{width:10,height:10,background:'green',marginRight:5}}></div>Enabled Slots are defined by green colour.</label>
        <label style={{display:'flex',alignItems:'center'}}><div style={{width:10,height:10,background:'red',marginRight:5}}></div>Full Booked Slots are defined by red colour.</label>
        </div>
        </div>
      {/* <div style={{
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        margin:20
      }}>
      <button onClick={setData}>
    <span>Save Setting</span>
        </button>
        </div> */}
    </div>
    </>
  )
};

export default CalendarWithTimeSlots;
