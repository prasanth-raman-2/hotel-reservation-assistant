"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, RefreshCw, Trash2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Reservation {
  id: string;
  guest_name: string;
  guest_email: string;
  room_type: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  status: string;
  special_requests: string | null;
  created_at: string | null;
}

const emptyForm = {
  guest_name: "",
  guest_email: "",
  room_type: "standard",
  check_in: "",
  check_out: "",
  num_guests: 1,
  special_requests: "",
};

export default function BookingsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [viewReservation, setViewReservation] = useState<Reservation | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reservations/`);
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      }
    } catch {
      toast.error("Failed to load reservations. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleCreate = async () => {
    if (!form.guest_name || !form.guest_email || !form.check_in || !form.check_out) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/reservations/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Reservation created successfully!");
        setForm(emptyForm);
        setDialogOpen(false);
        fetchReservations();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to create reservation.");
      }
    } catch {
      toast.error("Failed to create reservation.");
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/reservations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Reservation cancelled.");
        fetchReservations();
      } else {
        toast.error("Failed to cancel reservation.");
      }
    } catch {
      toast.error("Failed to cancel reservation.");
    }
  };

  const roomTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      standard: "Standard",
      deluxe: "Deluxe",
      suite: "Suite",
    };
    return map[type] || type;
  };

  const statusColor = (status: string) => {
    if (status === "confirmed") return "default";
    if (status === "cancelled") return "destructive";
    return "secondary";
  };

  return (
    <div className="container max-w-6xl py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground text-sm">
            Manage all hotel reservations. Bookings made via chat also appear here.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchReservations}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Reservation</DialogTitle>
                <DialogDescription>
                  Fill in the guest details to create a new booking.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guest_name">Guest Name *</Label>
                    <Input
                      id="guest_name"
                      value={form.guest_name}
                      onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guest_email">Email *</Label>
                    <Input
                      id="guest_email"
                      type="email"
                      value={form.guest_email}
                      onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Room Type</Label>
                    <Select
                      value={form.room_type}
                      onValueChange={(v) => setForm({ ...form, room_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="deluxe">Deluxe</SelectItem>
                        <SelectItem value="suite">Suite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="check_in">Check-in *</Label>
                    <Input
                      id="check_in"
                      type="date"
                      value={form.check_in}
                      onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="check_out">Check-out *</Label>
                    <Input
                      id="check_out"
                      type="date"
                      value={form.check_out}
                      onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="num_guests">Guests</Label>
                    <Input
                      id="num_guests"
                      type="number"
                      min={1}
                      max={10}
                      value={form.num_guests}
                      onChange={(e) =>
                        setForm({ ...form, num_guests: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="special_requests">Special Requests</Label>
                  <Textarea
                    id="special_requests"
                    value={form.special_requests}
                    onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
                    placeholder="Any special requirements..."
                    rows={2}
                  />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Reservation
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Reservations Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No reservations yet.</p>
              <p className="text-sm mt-1">
                Create one here or via the chat assistant.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{r.guest_name}</p>
                        <p className="text-xs text-muted-foreground">{r.guest_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{roomTypeLabel(r.room_type)}</TableCell>
                    <TableCell>{r.check_in}</TableCell>
                    <TableCell>{r.check_out}</TableCell>
                    <TableCell>{r.num_guests}</TableCell>
                    <TableCell>
                      <Badge variant={statusColor(r.status) as "default" | "destructive" | "secondary"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewReservation(r)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reservation Details</DialogTitle>
                            </DialogHeader>
                            {viewReservation && (
                              <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-muted-foreground">Reservation ID</p>
                                    <p className="font-mono text-xs">{viewReservation.id}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <Badge variant={statusColor(viewReservation.status) as "default" | "destructive" | "secondary"}>
                                      {viewReservation.status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Guest Name</p>
                                    <p>{viewReservation.guest_name}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p>{viewReservation.guest_email}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Room Type</p>
                                    <p>{roomTypeLabel(viewReservation.room_type)}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Guests</p>
                                    <p>{viewReservation.num_guests}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Check-in</p>
                                    <p>{viewReservation.check_in}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Check-out</p>
                                    <p>{viewReservation.check_out}</p>
                                  </div>
                                </div>
                                {viewReservation.special_requests && (
                                  <div>
                                    <p className="text-muted-foreground">Special Requests</p>
                                    <p>{viewReservation.special_requests}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {r.status === "confirmed" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Reservation?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will cancel the reservation for{" "}
                                  <strong>{r.guest_name}</strong> ({r.check_in} to{" "}
                                  {r.check_out}). This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancel(r.id)}
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                  Cancel Reservation
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
