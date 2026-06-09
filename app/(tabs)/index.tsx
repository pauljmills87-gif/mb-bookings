import React, { useEffect, useState } from "react";
import {
  ImageBackground,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const OPTIONS = {
  bookingSource: ["Private Booking", "Booking Agent"],
  agentName: ["VIP (Lauren)", "T & L Tours", "Algarve Party Planner (Kelsey)", "Other"],
  eventType: ["BBQ", "Karaoke", "DJ", "Private Chef", "Drinks Delivery", "Catering", "Other"],
  bbqPackage: ["Bronze", "Silver", "Gold", "Platinum", "Custom"],
  status: ["Deposit Paid", "Fully Paid", "Completed", "Cancelled"],
  staffRequired: ["Paul", "Jessica", "Server 1", "Server 2", "DJ", "Chef", "Other"],
  equipmentRequired: [
    "BBQ",
    "Towable BBQ",
    "Gazebo",
    "Karaoke System",
    "Speaker System",
    "Beer Pump",
    "Lighting",
    "Generator",
    "Other",
  ],
};

const T = {
  en: {
    thisWeek: "This Week",
    all: "All",
    add: "+ Add",
    settings: "Settings",
    allBookings: "ALL BOOKINGS",
    bookingDetails: "BOOKING DETAILS",
    addBooking: "ADD BOOKING",
    editBooking: "EDIT BOOKING",
    noWeek: "No bookings this week.",
    noBookings: "No bookings added yet.",
    source: "Booking Source",
    agent: "Agent Name",
    client: "Client Name",
    contact: "Contact Number",
    handle: "Email / Instagram Handle",
    eventType: "Event Type",
    package: "BBQ Package",
    date: "Event Date DD/MM/YYYY",
    time: "Event Time",
    guests: "Number of Guests",
    location: "Location",
    staff: "Staff Required",
    equipment: "Equipment Required",
    notes: "Notes / Special Requirements",
    status: "Status",
    save: "SAVE BOOKING",
    saveChanges: "SAVE CHANGES",
    complete: "Complete",
    edit: "Edit",
    delete: "Delete",
    back: "Back",
    language: "Language",
    english: "English",
    portuguese: "Português",
    markCompleted: "Mark Completed",
    deleteBooking: "Delete Booking",
  },
  pt: {
    thisWeek: "Esta Semana",
    all: "Todas",
    add: "+ Adicionar",
    settings: "Definições",
    allBookings: "TODAS AS RESERVAS",
    bookingDetails: "DETALHES DA RESERVA",
    addBooking: "ADICIONAR RESERVA",
    editBooking: "EDITAR RESERVA",
    noWeek: "Sem reservas esta semana.",
    noBookings: "Ainda não há reservas.",
    source: "Origem da Reserva",
    agent: "Nome do Agente",
    client: "Nome do Cliente",
    contact: "Contacto",
    handle: "Email / Instagram",
    eventType: "Tipo de Evento",
    package: "Pacote BBQ",
    date: "Data DD/MM/AAAA",
    time: "Hora",
    guests: "Número de Convidados",
    location: "Localização",
    staff: "Equipa Necessária",
    equipment: "Equipamento Necessário",
    notes: "Notas / Requisitos Especiais",
    status: "Estado",
    save: "GUARDAR RESERVA",
    saveChanges: "GUARDAR ALTERAÇÕES",
    complete: "Completar",
    edit: "Editar",
    delete: "Apagar",
    back: "Voltar",
    language: "Idioma",
    english: "English",
    portuguese: "Português",
    markCompleted: "Marcar como Completo",
    deleteBooking: "Apagar Reserva",
  },
};

const emptyForm = {
  bookingSource: "Private Booking",
  agentName: "",
  clientName: "",
  contactNumber: "",
  contactHandle: "",
  eventType: "BBQ",
  bbqPackage: "Bronze",
  date: "",
  time: "",
  guests: "",
  location: "",
  staffRequired: [] as string[],
  equipmentRequired: [] as string[],
  notes: "",
  status: "Deposit Paid",
};

type Booking = typeof emptyForm & { id: string };
type Screen = "week" | "all" | "add" | "settings" | "details";
type Lang = "en" | "pt";

function parseDisplayDate(dateString: string) {
  const parts = dateString.trim().split("/");
  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);

  if (!day || !month || !year) return null;
  if (day < 1 || day > 31) return null;
  if (month < 1 || month > 12) return null;

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isBookingThisWeek(booking: Booking) {
  console.log("BOOKING CHECK", booking);
  const bookingDate = parseDisplayDate(booking.date);
  if (!bookingDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  return (
    bookingDate >= today &&
    bookingDate <= weekEnd &&
    booking.status !== "Completed" &&
    booking.status !== "Cancelled"
  );
}

function sortBookingsByDate(bookings: Booking[]) {
  return [...bookings].sort((a, b) => {
    const dateA = parseDisplayDate(a.date);
    const dateB = parseDisplayDate(b.date);

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return dateA.getTime() - dateB.getTime();
  });
}

function rowToBooking(row: any): Booking {
  return {
    id: row.id,
    bookingSource: row.booking_source || "Private Booking",
    agentName: row.agent_name || "",
    clientName: row.client_name || "",
    contactNumber: row.contact_number || "",
    contactHandle: row.contact_handle || "",
    eventType: row.event_type || "BBQ",
    bbqPackage: row.bbq_package || "",
    date: row.event_date || "",
    time: row.event_time || "",
    guests: row.guests || "",
    location: row.location || "",
    staffRequired: Array.isArray(row.staff_required) ? row.staff_required : [],
    equipmentRequired: Array.isArray(row.equipment_required) ? row.equipment_required : [],
    notes: row.notes || "",
    status: row.status || "Deposit Paid",
  };
}

function bookingToRow(booking: typeof emptyForm) {
  return {
    booking_source: booking.bookingSource,
    agent_name: booking.bookingSource === "Booking Agent" ? booking.agentName : "",
    client_name: booking.clientName.trim(),
    contact_number: booking.contactNumber.trim(),
    contact_handle: booking.contactHandle.trim(),
    event_type: booking.eventType,
    bbq_package: booking.eventType === "BBQ" ? booking.bbqPackage : "",
    event_date: booking.date.trim(),
    event_time: booking.time.trim(),
    guests: booking.guests.trim(),
    location: booking.location.trim(),
    staff_required: booking.staffRequired || [],
    equipment_required: booking.equipmentRequired || [],
    notes: booking.notes.trim(),
    status: booking.status,
  };
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <ImageBackground
      source={require("../../assets/images/MBBlogobg.png")}
      style={styles.pageShell}
      resizeMode="stretch"
    >
      <View style={styles.scrollZone}>{children}</View>
    </ImageBackground>
  );
}

function OptionButtons({ label, options, value, onSelect }: any) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((option: string) => {
          const active = value === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, active && styles.optionButtonActive]}
              onPress={() => onSelect(option)}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Checklist({ label, options, values, onToggle }: any) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((option: string) => {
          const active = values.includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, active && styles.optionButtonActive]}
              onPress={() => onToggle(option)}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function AppInput({
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
}: any) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.notesInput]}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      multiline={multiline}
      returnKeyType="done"
      blurOnSubmit={true}
      onSubmitEditing={() => Keyboard.dismiss()}
    />
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const [screen, setScreen] = useState<Screen>("week");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const text = T[lang];

  useEffect(() => {
    loadBookings();

    const channel = supabase
      .channel("bookings-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.log("Load bookings error:", error);
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setBookings((data || []).map(rowToBooking));
    setLoading(false);
  };

  const sortedBookings = sortBookingsByDate(bookings);
  const thisWeekBookings = sortedBookings.filter(isBookingThisWeek);

  const updateField = (key: keyof typeof emptyForm, value: any) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const toggleArrayItem = (
    key: "staffRequired" | "equipmentRequired",
    item: string
  ) => {
    setForm((previous) => {
      const current = previous[key];
      const exists = current.includes(item);

      return {
        ...previous,
        [key]: exists ? current.filter((x) => x !== item) : [...current, item],
      };
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveBooking = async () => {
    if (!form.clientName.trim()) return;
    if (!form.date.trim()) return;

    setLoading(true);
    setErrorMessage("");

    const row = bookingToRow(form);

    if (editingId) {
      const { error } = await supabase
        .from("bookings")
        .update(row)
        .eq("id", editingId);

      if (error) {
        console.log("Update booking error:", error);
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      await loadBookings();

      const updatedBooking: Booking = { ...form, id: editingId };
      setSelectedBooking(updatedBooking);
    } else {
      const { data, error } = await supabase
        .from("bookings")
        .insert([row])
        .select()
        .single();

      if (error) {
        console.log("Insert booking error:", error);
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      const newBooking = rowToBooking(data);
      setBookings((previous) => [...previous, newBooking]);
      setSelectedBooking(newBooking);
    }

    resetForm();
    setScreen("week");
    setLoading(false);
  };

  const openBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setScreen("details");
  };

  const editBooking = (booking: Booking) => {
    setForm({
      ...emptyForm,
      ...booking,
      staffRequired: booking.staffRequired || [],
      equipmentRequired: booking.equipmentRequired || [],
    });
    setEditingId(booking.id);
    setSelectedBooking(booking);
    setScreen("add");
  };

  const markCompleted = async (id: string) => {
    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("bookings")
      .update({ status: "Completed" })
      .eq("id", id);

    if (error) {
      console.log("Complete booking error:", error);
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setBookings((previous) =>
      previous.map((booking) =>
        booking.id === id ? { ...booking, status: "Completed" } : booking
      )
    );

    setSelectedBooking((previous) =>
      previous && previous.id === id ? { ...previous, status: "Completed" } : previous
    );

    setLoading(false);
  };

  const deleteBooking = async (id: string) => {
    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) {
      console.log("Delete booking error:", error);
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setBookings((previous) => previous.filter((booking) => booking.id !== id));

    if (selectedBooking?.id === id) {
      setSelectedBooking(null);
      setScreen("week");
    }

    setLoading(false);
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      activeOpacity={0.85}
      onPress={() => openBooking(booking)}
    >
      <Text style={styles.cardDate}>
        {booking.date} {booking.time ? `• ${booking.time}` : ""}
      </Text>

      <Text style={styles.cardTitle}>{booking.clientName}</Text>

      <Text style={styles.cardText}>
        {booking.eventType}
        {booking.bbqPackage ? ` • ${booking.bbqPackage}` : ""}
      </Text>

      <Text style={styles.cardText}>{booking.guests} guests</Text>

      {!!booking.location && (
        <Text style={styles.cardText} numberOfLines={1}>
          {booking.location}
        </Text>
      )}

      <Text style={styles.cardText}>
        Source: {booking.bookingSource}
        {booking.agentName ? ` - ${booking.agentName}` : ""}
      </Text>

      <Text style={styles.cardStatus}>{booking.status}</Text>

      <View style={styles.cardButtonRow}>
        <TouchableOpacity style={styles.cardButton} onPress={() => editBooking(booking)}>
          <Text style={styles.cardButtonText}>{text.edit}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardButton}
          onPress={() => markCompleted(booking.id)}
        >
          <Text style={styles.cardButtonText}>{text.complete}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteBooking(booking.id)}>
          <Text style={styles.cardButtonText}>{text.delete}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const StatusLine = () => (
    <>
      {loading && <Text style={styles.statusMessage}>Loading...</Text>}
      {!!errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
    </>
  );

  return (
    <View style={styles.app}>
      {screen === "week" && (
        <PageShell>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <StatusLine />
            {thisWeekBookings.length === 0 ? (
              <Text style={styles.emptyText}>{text.noWeek}</Text>
            ) : (
              thisWeekBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </ScrollView>
        </PageShell>
      )}

      {screen === "all" && (
        <PageShell>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <StatusLine />
            <Text style={styles.pageTitle}>{text.allBookings}</Text>

            {sortedBookings.length === 0 ? (
              <Text style={styles.emptyText}>{text.noBookings}</Text>
            ) : (
              sortedBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </ScrollView>
        </PageShell>
      )}

      {screen === "details" && selectedBooking && (
        <PageShell>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <StatusLine />
            <Text style={styles.pageTitle}>{text.bookingDetails}</Text>

            <View style={styles.detailsCard}>
              <DetailRow label={text.client} value={selectedBooking.clientName} />
              <DetailRow label={text.contact} value={selectedBooking.contactNumber} />
              <DetailRow label={text.handle} value={selectedBooking.contactHandle} />
              <DetailRow label={text.source} value={selectedBooking.bookingSource} />
              <DetailRow label={text.agent} value={selectedBooking.agentName} />
              <DetailRow label={text.eventType} value={selectedBooking.eventType} />
              <DetailRow label={text.package} value={selectedBooking.bbqPackage} />
              <DetailRow label={text.date} value={selectedBooking.date} />
              <DetailRow label={text.time} value={selectedBooking.time} />
              <DetailRow label={text.guests} value={selectedBooking.guests} />
              <DetailRow label={text.location} value={selectedBooking.location} />
              <DetailRow label={text.staff} value={selectedBooking.staffRequired.join(", ")} />
              <DetailRow
                label={text.equipment}
                value={selectedBooking.equipmentRequired.join(", ")}
              />
              <DetailRow label={text.notes} value={selectedBooking.notes} />
              <DetailRow label={text.status} value={selectedBooking.status} />

              <TouchableOpacity style={styles.fullButton} onPress={() => editBooking(selectedBooking)}>
                <Text style={styles.fullButtonText}>{text.editBooking}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fullButton}
                onPress={() => markCompleted(selectedBooking.id)}
              >
                <Text style={styles.fullButtonText}>{text.markCompleted}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteFullButton}
                onPress={() => deleteBooking(selectedBooking.id)}
              >
                <Text style={styles.fullButtonText}>{text.deleteBooking}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.outlineButton} onPress={() => setScreen("week")}>
                <Text style={styles.outlineButtonText}>{text.back}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </PageShell>
      )}

      {screen === "add" && (
        <PageShell>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            <StatusLine />
            <Text style={styles.pageTitle}>
              {editingId ? text.editBooking : text.addBooking}
            </Text>

            <OptionButtons
              label={text.source}
              options={OPTIONS.bookingSource}
              value={form.bookingSource}
              onSelect={(v: string) => updateField("bookingSource", v)}
            />

            {form.bookingSource === "Booking Agent" && (
              <OptionButtons
                label={text.agent}
                options={OPTIONS.agentName}
                value={form.agentName}
                onSelect={(v: string) => updateField("agentName", v)}
              />
            )}

            <AppInput
              placeholder={text.client}
              value={form.clientName}
              onChangeText={(v: string) => updateField("clientName", v)}
            />

            <AppInput
              placeholder={text.contact}
              value={form.contactNumber}
              onChangeText={(v: string) => updateField("contactNumber", v)}
            />

            <AppInput
              placeholder={text.handle}
              value={form.contactHandle}
              onChangeText={(v: string) => updateField("contactHandle", v)}
              autoCapitalize="none"
            />

            <OptionButtons
              label={text.eventType}
              options={OPTIONS.eventType}
              value={form.eventType}
              onSelect={(v: string) => updateField("eventType", v)}
            />

            {form.eventType === "BBQ" && (
              <OptionButtons
                label={text.package}
                options={OPTIONS.bbqPackage}
                value={form.bbqPackage}
                onSelect={(v: string) => updateField("bbqPackage", v)}
              />
            )}

            <AppInput
              placeholder={text.date}
              value={form.date}
              onChangeText={(v: string) => updateField("date", v)}
              keyboardType="numbers-and-punctuation"
            />

            <AppInput
              placeholder={text.time}
              value={form.time}
              onChangeText={(v: string) => updateField("time", v)}
            />

            <AppInput
              placeholder={text.guests}
              value={form.guests}
              onChangeText={(v: string) => updateField("guests", v)}
              keyboardType="numeric"
            />

            <AppInput
              placeholder={text.location}
              value={form.location}
              onChangeText={(v: string) => updateField("location", v)}
            />

            <Checklist
              label={text.staff}
              options={OPTIONS.staffRequired}
              values={form.staffRequired}
              onToggle={(v: string) => toggleArrayItem("staffRequired", v)}
            />

            <Checklist
              label={text.equipment}
              options={OPTIONS.equipmentRequired}
              values={form.equipmentRequired}
              onToggle={(v: string) => toggleArrayItem("equipmentRequired", v)}
            />

            <AppInput
              placeholder={text.notes}
              value={form.notes}
              onChangeText={(v: string) => updateField("notes", v)}
              multiline
            />

            <OptionButtons
              label={text.status}
              options={OPTIONS.status}
              value={form.status}
              onSelect={(v: string) => updateField("status", v)}
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveBooking}>
              <Text style={styles.saveButtonText}>
                {editingId ? text.saveChanges : text.save}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </PageShell>
      )}

      {screen === "settings" && (
        <PageShell>
          <View style={styles.settingsBox}>
            <StatusLine />
            <Text style={styles.pageTitle}>{text.settings}</Text>

            <OptionButtons
              label={text.language}
              options={[text.english, text.portuguese]}
              value={lang === "en" ? text.english : text.portuguese}
              onSelect={(v: string) => setLang(v === text.english ? "en" : "pt")}
            />
          </View>
        </PageShell>
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => setScreen("week")}>
          <Text style={[styles.navText, screen === "week" && styles.navTextActive]}>
            {text.thisWeek}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreen("all")}>
          <Text style={[styles.navText, screen === "all" && styles.navTextActive]}>
            {text.all}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            resetForm();
            setScreen("add");
          }}
        >
          <Text style={[styles.navText, screen === "add" && styles.navTextActive]}>
            {text.add}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreen("settings")}>
          <Text style={[styles.navText, screen === "settings" && styles.navTextActive]}>
            {text.settings}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "#fff",
  },

  pageShell: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 35,
  },

  scrollZone: {
    flex: 1,
    paddingTop: 170,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 110,
  },

  formContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 120,
  },

  pageTitle: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 22,
  },

  emptyText: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 0,
  },

  statusMessage: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },

  errorMessage: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    color: "#8B0000",
    marginBottom: 8,
  },

  fieldBlock: {
    marginBottom: 18,
  },

  fieldLabel: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },

  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  optionButton: {
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },

  optionButtonActive: {
    backgroundColor: "#000",
  },

  optionText: {
    color: "#000",
    fontWeight: "800",
  },

  optionTextActive: {
    color: "#fff",
  },

  input: {
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#fff",
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "600",
  },

  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  bookingCard: {
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 15,
  },

  cardDate: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
  },

  cardText: {
    fontSize: 16,
    marginBottom: 4,
  },

  cardStatus: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
  },

  cardButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },

  cardButton: {
    flex: 1,
    backgroundColor: "#000",
    padding: 10,
    alignItems: "center",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#8B0000",
    padding: 10,
    alignItems: "center",
  },

  cardButtonText: {
    color: "#fff",
    fontWeight: "900",
  },

  detailsCard: {
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 15,
  },

  detailRow: {
    marginBottom: 12,
  },

  detailLabel: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 3,
  },

  detailValue: {
    fontSize: 17,
    fontWeight: "600",
  },

  fullButton: {
    backgroundColor: "#000",
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },

  deleteFullButton: {
    backgroundColor: "#8B0000",
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },

  fullButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  outlineButton: {
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#fff",
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },

  outlineButtonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 15,
  },

  saveButton: {
    backgroundColor: "#000",
    padding: 18,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },

  saveButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  settingsBox: {
    paddingHorizontal: 20,
    paddingTop: 0,
  },

  bottomNav: {
    height: 74,
    borderTopWidth: 2,
    borderColor: "#000",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  navText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000",
  },

  navTextActive: {
    textDecorationLine: "underline",
  },
});