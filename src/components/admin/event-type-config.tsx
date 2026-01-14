"use client";

import { useState, useEffect, useRef } from "react";
import { format, addDays, addHours, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CalendarRange,
  Film,
  Grid3x3,
  Users,
  CalendarDays,
  Ticket,
  Plus,
  Trash2,
  X,
} from "lucide-react";

export type EventTypeConfig =
  | { type: "fixed-duration"; startDate: string; endDate: string }
  | { type: "multi-day"; startDate: string; endDate: string; days: string[] }
  | {
      type: "sessions";
      sessions: Array<{ id: string; date: string; name: string }>;
    }
  | {
      type: "numbered-seats";
      rows: number;
      seatsPerRow: number;
      seatMap: string[][];
    }
  | { type: "general-admission"; capacity: number }
  | {
      type: "day-access";
      days: Array<{ date: string; name: string; capacity?: number }>;
    }
  | { type: "full-access"; startDate: string; endDate: string };

type EventTypeConfigProps = {
  value?: EventTypeConfig;
  onChange: (config: EventTypeConfig) => void;
  defaultStartDate?: string;
};

export default function EventTypeConfig({
  value,
  onChange,
  defaultStartDate,
}: EventTypeConfigProps) {
  const [selectedType, setSelectedType] = useState<EventTypeConfig["type"]>(
    value?.type || "fixed-duration"
  );

  // Estado para cada tipo de evento
  const [fixedDuration, setFixedDuration] = useState({
    startDate:
      value?.type === "fixed-duration"
        ? value.startDate
        : defaultStartDate || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endDate:
      value?.type === "fixed-duration"
        ? value.endDate
        : format(addHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm"),
  });

  const [multiDay, setMultiDay] = useState({
    startDate:
      value?.type === "multi-day"
        ? value.startDate
        : defaultStartDate || format(new Date(), "yyyy-MM-dd"),
    endDate:
      value?.type === "multi-day"
        ? value.endDate
        : format(addDays(new Date(), 1), "yyyy-MM-dd"),
    days: value?.type === "multi-day" ? value.days : [],
  });

  const [sessions, setSessions] = useState<
    Array<{ id: string; date: string; name: string }>
  >(
    value?.type === "sessions"
      ? value.sessions
      : [
          {
            id: crypto.randomUUID(),
            date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            name: "Función 1",
          },
        ]
  );

  const [numberedSeats, setNumberedSeats] = useState({
    rows: value?.type === "numbered-seats" ? value.rows : 10,
    seatsPerRow: value?.type === "numbered-seats" ? value.seatsPerRow : 20,
    seatMap: value?.type === "numbered-seats" ? value.seatMap : [],
  });

  const [generalAdmission, setGeneralAdmission] = useState({
    capacity: value?.type === "general-admission" ? value.capacity : 100,
  });

  const [dayAccess, setDayAccess] = useState<
    Array<{ date: string; name: string; capacity?: number }>
  >(
    value?.type === "day-access"
      ? value.days
      : [
          {
            date: format(new Date(), "yyyy-MM-dd"),
            name: "Día 1",
            capacity: 100,
          },
        ]
  );

  const [fullAccess, setFullAccess] = useState({
    startDate:
      value?.type === "full-access"
        ? value.startDate
        : defaultStartDate || format(new Date(), "yyyy-MM-dd"),
    endDate:
      value?.type === "full-access"
        ? value.endDate
        : format(addDays(new Date(), 1), "yyyy-MM-dd"),
  });

  // Ref para evitar bucle infinito: rastrear si estamos sincronizando desde el prop
  const isSyncingFromProp = useRef(false);
  const previousValueRef = useRef<EventTypeConfig | undefined>(value);

  // Sincronizar estado cuando cambia el prop value (útil para edición)
  useEffect(() => {
    // Solo sincronizar si el valor realmente cambió (comparación profunda)
    if (
      value &&
      JSON.stringify(value) !== JSON.stringify(previousValueRef.current)
    ) {
      isSyncingFromProp.current = true;
      previousValueRef.current = value;

      setSelectedType(value.type);

      switch (value.type) {
        case "fixed-duration":
          setFixedDuration({
            startDate: value.startDate,
            endDate: value.endDate,
          });
          break;
        case "multi-day":
          setMultiDay({
            startDate: value.startDate,
            endDate: value.endDate,
            days: value.days,
          });
          break;
        case "sessions":
          setSessions(value.sessions);
          break;
        case "numbered-seats":
          setNumberedSeats({
            rows: value.rows,
            seatsPerRow: value.seatsPerRow,
            seatMap: value.seatMap,
          });
          break;
        case "general-admission":
          setGeneralAdmission({ capacity: value.capacity });
          break;
        case "day-access":
          setDayAccess(value.days);
          break;
        case "full-access":
          setFullAccess({ startDate: value.startDate, endDate: value.endDate });
          break;
      }

      // Resetear la bandera después de un pequeño delay
      setTimeout(() => {
        isSyncingFromProp.current = false;
      }, 0);
    }
  }, [value]);

  // Generar mapa de asientos cuando cambian las dimensiones
  useEffect(() => {
    if (
      selectedType === "numbered-seats" &&
      numberedSeats.rows > 0 &&
      numberedSeats.seatsPerRow > 0
    ) {
      // Solo regenerar si no hay un seatMap existente o si las dimensiones cambiaron
      const expectedSeats = numberedSeats.rows * numberedSeats.seatsPerRow;
      const currentSeats = numberedSeats.seatMap.flat().length;

      if (currentSeats !== expectedSeats) {
        const newSeatMap: string[][] = [];
        for (let row = 0; row < numberedSeats.rows; row++) {
          const rowSeats: string[] = [];
          for (let seat = 0; seat < numberedSeats.seatsPerRow; seat++) {
            rowSeats.push(`${String.fromCharCode(65 + row)}${seat + 1}`);
          }
          newSeatMap.push(rowSeats);
        }
        setNumberedSeats((prev) => ({ ...prev, seatMap: newSeatMap }));
      }
    }
  }, [selectedType, numberedSeats.rows, numberedSeats.seatsPerRow]);

  // Generar días para multi-day
  useEffect(() => {
    if (
      selectedType === "multi-day" &&
      multiDay.startDate &&
      multiDay.endDate
    ) {
      const start = parseISO(multiDay.startDate);
      const end = parseISO(multiDay.endDate);
      const days: string[] = [];
      let current = start;
      while (current <= end) {
        days.push(format(current, "yyyy-MM-dd"));
        current = addDays(current, 1);
      }
      setMultiDay((prev) => ({ ...prev, days }));
    }
  }, [selectedType, multiDay.startDate, multiDay.endDate]);

  // Notificar cambios al componente padre (solo cuando el usuario hace cambios)
  useEffect(() => {
    // No llamar onChange si estamos sincronizando desde el prop
    if (isSyncingFromProp.current) {
      return;
    }

    let config: EventTypeConfig;

    switch (selectedType) {
      case "fixed-duration":
        config = { type: "fixed-duration", ...fixedDuration };
        break;
      case "multi-day":
        config = { type: "multi-day", ...multiDay };
        break;
      case "sessions":
        config = { type: "sessions", sessions };
        break;
      case "numbered-seats":
        config = { type: "numbered-seats", ...numberedSeats };
        break;
      case "general-admission":
        config = { type: "general-admission", ...generalAdmission };
        break;
      case "day-access":
        config = { type: "day-access", days: dayAccess };
        break;
      case "full-access":
        config = { type: "full-access", ...fullAccess };
        break;
      default:
        config = { type: "fixed-duration", ...fixedDuration };
    }

    // Comparar con el valor anterior para evitar llamadas innecesarias
    const configString = JSON.stringify(config);
    const previousConfigString = JSON.stringify(previousValueRef.current);

    if (configString !== previousConfigString) {
      previousValueRef.current = config;
      onChange(config);
    }
  }, [
    selectedType,
    fixedDuration,
    multiDay,
    sessions,
    numberedSeats,
    generalAdmission,
    dayAccess,
    fullAccess,
    onChange,
  ]);

  const addSession = () => {
    const lastSession = sessions[sessions.length - 1];
    const lastDate = lastSession ? parseISO(lastSession.date) : new Date();
    const newDate = addHours(lastDate, 2);

    setSessions([
      ...sessions,
      {
        id: crypto.randomUUID(),
        date: format(newDate, "yyyy-MM-dd'T'HH:mm"),
        name: `Función ${sessions.length + 1}`,
      },
    ]);
  };

  const removeSession = (id: string) => {
    if (sessions.length > 1) {
      setSessions(sessions.filter((s) => s.id !== id));
    }
  };

  const updateSession = (id: string, field: "date" | "name", value: string) => {
    setSessions(
      sessions.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addDayAccess = () => {
    const lastDay = dayAccess[dayAccess.length - 1];
    const lastDate = lastDay ? parseISO(lastDay.date) : new Date();
    const newDate = addDays(lastDate, 1);

    setDayAccess([
      ...dayAccess,
      {
        date: format(newDate, "yyyy-MM-dd"),
        name: `Día ${dayAccess.length + 1}`,
        capacity: 100,
      },
    ]);
  };

  const removeDayAccess = (index: number) => {
    if (dayAccess.length > 1) {
      setDayAccess(dayAccess.filter((_, i) => i !== index));
    }
  };

  const updateDayAccess = (
    index: number,
    field: "date" | "name" | "capacity",
    value: string | number | undefined
  ) => {
    setDayAccess(
      dayAccess.map((day, i) =>
        i === index ? { ...day, [field]: value } : day
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Tipo de Evento</CardTitle>
        <CardDescription>
          Selecciona cómo se estructurará tu evento y configura los detalles
          específicos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selector de tipo de evento */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Tipo de Evento</Label>
          <RadioGroup
            value={selectedType}
            onValueChange={(value) =>
              setSelectedType(value as EventTypeConfig["type"])
            }
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="fixed-duration" id="fixed-duration" />
              <Label htmlFor="fixed-duration" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Duración Fija</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Evento con fecha y hora de inicio y fin específicas
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="multi-day" id="multi-day" />
              <Label htmlFor="multi-day" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4" />
                  <span className="font-medium">Varios Días</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Evento que ocurre en un rango de fechas
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="sessions" id="sessions" />
              <Label htmlFor="sessions" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  <span className="font-medium">Sesiones/Funciones</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Múltiples sesiones del mismo evento (ej: teatro)
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="numbered-seats" id="numbered-seats" />
              <Label htmlFor="numbered-seats" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  <span className="font-medium">Asientos Numerados</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Eventos con asientos específicos seleccionables
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem
                value="general-admission"
                id="general-admission"
              />
              <Label
                htmlFor="general-admission"
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Sin Asientos (Aforo)</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Solo capacidad general, sin asientos específicos
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="day-access" id="day-access" />
              <Label htmlFor="day-access" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-medium">Acceso por Día</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Acceso solo a días específicos del evento
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="full-access" id="full-access" />
              <Label htmlFor="full-access" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  <span className="font-medium">Acceso Total</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Acceso completo a todos los días/sesiones
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Configuraciones específicas según el tipo seleccionado */}
        <div className="space-y-4">
          {selectedType === "fixed-duration" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Configuración de Duración Fija
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fixed-start">Fecha y Hora de Inicio</Label>
                  <Input
                    id="fixed-start"
                    type="datetime-local"
                    value={fixedDuration.startDate}
                    onChange={(e) =>
                      setFixedDuration({
                        ...fixedDuration,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fixed-end">Fecha y Hora de Fin</Label>
                  <Input
                    id="fixed-end"
                    type="datetime-local"
                    value={fixedDuration.endDate}
                    onChange={(e) =>
                      setFixedDuration({
                        ...fixedDuration,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {selectedType === "multi-day" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <CalendarRange className="h-4 w-4" />
                Configuración de Varios Días
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="multi-start">Fecha de Inicio</Label>
                  <Input
                    id="multi-start"
                    type="date"
                    value={multiDay.startDate}
                    onChange={(e) =>
                      setMultiDay({ ...multiDay, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="multi-end">Fecha de Fin</Label>
                  <Input
                    id="multi-end"
                    type="date"
                    value={multiDay.endDate}
                    onChange={(e) =>
                      setMultiDay({ ...multiDay, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              {multiDay.days.length > 0 && (
                <div className="mt-4">
                  <Label>Días incluidos ({multiDay.days.length} días)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {multiDay.days.map((day, idx) => (
                      <Badge key={idx} variant="secondary">
                        {format(parseISO(day), "dd/MM/yyyy")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedType === "sessions" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  Configuración de Sesiones/Funciones
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSession}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Sesión
                </Button>
              </div>
              <div className="space-y-3">
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="flex gap-3 items-end p-3 border rounded-lg"
                  >
                    <div className="flex-1 space-y-2">
                      <Label>Nombre de la Sesión</Label>
                      <Input
                        value={session.name}
                        onChange={(e) =>
                          updateSession(session.id, "name", e.target.value)
                        }
                        placeholder={`Función ${index + 1}`}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Fecha y Hora</Label>
                      <Input
                        type="datetime-local"
                        value={session.date}
                        onChange={(e) =>
                          updateSession(session.id, "date", e.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSession(session.id)}
                      disabled={sessions.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedType === "numbered-seats" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <Grid3x3 className="h-4 w-4" />
                Configuración de Asientos Numerados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seat-rows">Número de Filas</Label>
                  <Input
                    id="seat-rows"
                    type="number"
                    min="1"
                    max="50"
                    value={numberedSeats.rows}
                    onChange={(e) =>
                      setNumberedSeats({
                        ...numberedSeats,
                        rows: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seat-per-row">Asientos por Fila</Label>
                  <Input
                    id="seat-per-row"
                    type="number"
                    min="1"
                    max="100"
                    value={numberedSeats.seatsPerRow}
                    onChange={(e) =>
                      setNumberedSeats({
                        ...numberedSeats,
                        seatsPerRow: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              {numberedSeats.seatMap.length > 0 && (
                <div className="mt-4">
                  <Label>Vista Previa del Mapa de Asientos</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-background max-h-64 overflow-auto">
                    <div className="space-y-1">
                      {numberedSeats.seatMap.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex gap-1 justify-center">
                          {row.map((seat, seatIdx) => (
                            <div
                              key={seatIdx}
                              className="w-8 h-8 flex items-center justify-center text-xs border rounded bg-muted hover:bg-accent cursor-pointer"
                              title={seat}
                            >
                              {seat}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Total: {numberedSeats.rows * numberedSeats.seatsPerRow}{" "}
                      asientos
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedType === "general-admission" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Configuración de Aforo General
              </h3>
              <div className="space-y-2">
                <Label htmlFor="ga-capacity">Capacidad Total</Label>
                <Input
                  id="ga-capacity"
                  type="number"
                  min="1"
                  value={generalAdmission.capacity}
                  onChange={(e) =>
                    setGeneralAdmission({
                      capacity: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="100"
                />
                <p className="text-sm text-muted-foreground">
                  Número máximo de personas que pueden asistir al evento.
                </p>
              </div>
            </div>
          )}

          {selectedType === "day-access" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Configuración de Acceso por Día
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDayAccess}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Día
                </Button>
              </div>
              <div className="space-y-3">
                {dayAccess.map((day, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-end p-3 border rounded-lg"
                  >
                    <div className="flex-1 space-y-2">
                      <Label>Nombre del Día</Label>
                      <Input
                        value={day.name}
                        onChange={(e) =>
                          updateDayAccess(index, "name", e.target.value)
                        }
                        placeholder={`Día ${index + 1}`}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={day.date}
                        onChange={(e) =>
                          updateDayAccess(index, "date", e.target.value)
                        }
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label>Capacidad (opcional)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={day.capacity || ""}
                        onChange={(e) =>
                          updateDayAccess(
                            index,
                            "capacity",
                            parseInt(e.target.value) || undefined
                          )
                        }
                        placeholder="100"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDayAccess(index)}
                      disabled={dayAccess.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedType === "full-access" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Configuración de Acceso Total
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-start">Fecha de Inicio</Label>
                  <Input
                    id="full-start"
                    type="date"
                    value={fullAccess.startDate}
                    onChange={(e) =>
                      setFullAccess({
                        ...fullAccess,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full-end">Fecha de Fin</Label>
                  <Input
                    id="full-end"
                    type="date"
                    value={fullAccess.endDate}
                    onChange={(e) =>
                      setFullAccess({ ...fullAccess, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Los usuarios con acceso total podrán asistir a todas las
                sesiones y días del evento.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
