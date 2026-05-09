import React, { useEffect, useState } from "react";
import { useLoader } from "../../context/LoaderContext";
import axios from "axios";
import Swal from "sweetalert2";
const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function FeeStructure() {
  const { showLoader, hideLoader } = useLoader();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        showLoader();
        const res = await axios.get("https://api.care2connect.in/doctor_list");
        const response = res.data;

        const base_list = response.map((doc) => ({
          appointmentfee: doc.appointmentfee,
          otcfee: doc.otcfee,
          platformfee: doc.platformfee,
          id: doc._id,
          name: doc.name,
          dirty: false,
        }));

        setRows(base_list);
      } catch (error) {
        console.error(error);
        Swal.fire("Failed", "Failed to Retrieve Doctors", "error");
      } finally {
        hideLoader();
      }
    })();
  }, []);

  const handleEdit = (id, key, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [key]: value, dirty: true } : row
      )
    );
  };

  const handleUpdate = (row) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to update the fees?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Update!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.post(
            `${API_BASE_URL}/update_user/${row.id}/`,
            {
              appointmentfee: row.appointmentfee,
              otcfee: row.otcfee,
              platformfee: row.platformfee,
            }
          );

          if (res.data.success) {
            Swal.fire("Updated!", "Doctor fee updated successfully", "success");
            setRows((prev) =>
              prev.map((r) =>
                r.id === row.id ? { ...r, dirty: false } : r
              )
            );
          } else {
            Swal.fire("Info", res.data.message || "No changes made", "info");
          }
        } catch (error) {
          Swal.fire(
            "Error!",
            error.response?.data?.error || "Something went wrong!",
            "error"
          );
        }
      }
    });
  };

  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-gray-100">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0 shadow">
          <tr className="text-left text-gray-700">
            <th className="px-6 py-3 font-semibold">Doctor</th>
            <th className="px-6 py-3 font-semibold">OTC Fee</th>
            <th className="px-6 py-3 font-semibold">Platform Fee</th>
            <th className="px-6 py-3 font-semibold">Consultation Fee</th>
            <th className="px-6 py-3 font-semibold text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id}
              className={`${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-blue-50 transition`}
            >
              <td className="px-6 py-3 font-medium text-gray-800">
                <EditableCell row={row} column="name" onEdit={handleEdit} />
              </td>
              <td className="px-6 py-3 text-gray-600">
                <EditableCell row={row} column="otcfee" onEdit={handleEdit} />
              </td>
              <td className="px-6 py-3 text-gray-600">
                <EditableCell
                  row={row}
                  column="platformfee"
                  onEdit={handleEdit}
                />
              </td>
              <td className="px-6 py-3 text-gray-600">
                <EditableCell
                  row={row}
                  column="appointmentfee"
                  onEdit={handleEdit}
                />
              </td>
              <td className="px-6 py-3 text-center">
                <button
                  onClick={() => handleUpdate(row)}
                  disabled={!row.dirty}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold shadow transition ${
                    row.dirty
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Update
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditableCell({ row, column, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row[column]);

  useEffect(() => {
    setValue(row[column]);
  }, [row[column]]);

  const commitEdit = () => {
    if (value !== row[column]) {
      onEdit(row.id, column, value);
    }
    setEditing(false);
  };

  return editing ? (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commitEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commitEdit();
        if (e.key === "Escape") setEditing(false);
      }}
      className="border px-3 py-1 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  ) : (
    <span
      onDoubleClick={() => setEditing(true)}
      className="cursor-pointer text-gray-700"
    >
      {row[column]}
    </span>
  );
}
