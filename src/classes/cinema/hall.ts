import { LoaderFactory } from "@/dataloader/loader-factory";
import { table_cinema_hall, table_cinema_seat } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { v4 } from "uuid";

export interface CinemaHallSeat {
  id: string;
  hallId: string;
  row: string;
  column: number;
  type: "standard" | "vip" | "couple" | "wheelchair" | "blocked";
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  groupId?: string;
  hall?: CinemaHall | null;
}

export interface SeatPart {
  id: string;
  range: string;
  description?: string;
}

export interface CinemaHall {
  id: string;
  name: string;
  number: number;
  columns: number;
  rows: number;
  features: unknown[];
  status: "active" | "maintenance" | "inactive";
  totalSeats: number;
  createdAt: string;
  updatedAt: string;
  createdBy: UserInfo | null;
  seats: CinemaHallSeat[];
  parts: SeatPart[];
}

export interface CinemaHallInput {
  name: string;
  number: number;
  rows: number;
  columns: number;
  features: unknown[];
  status: "active" | "maintenance" | "inactive";
  seats: {
    id: string;
    row: number;
    column: number;
    type: "standard" | "vip" | "couple" | "wheelchair" | "blocked";
    groupId?: string;
  }[];
  parts: {
    id: string;
    range: string;
    description?: string;
  }[];
}

export class CinemaHallService {
  constructor(
    protected tx: Knex,
    protected user: UserInfo,
  ) {}

  async getHallList(limit: number, offset: number, status?: string[]) {
    const query = this.tx
      .table("cinema_hall")
      .where("deleted_at", null)
      .where("warehouse_id", this.user.currentWarehouseId || "");

    if (status && status.length > 0) {
      query.whereIn("status", status);
    }

    const { total } = await query
      .clone()
      .count("* as total")
      .first<{ total: number }>();

    const halls = await query
      .clone()
      .select("*")
      .limit(limit)
      .offset(offset)
      .orderBy("hall_number", "asc");

    const seatLoader = LoaderFactory.cinemaHallSeatLoader(this.tx);
    const userLoader = LoaderFactory.userLoader(this.tx);

    const data = await Promise.all(
      halls.map(async (hall) => {
        return {
          id: hall.hall_id,
          name: hall.hall_name,
          number: hall.hall_number,
          columns: hall.columns,
          rows: hall.rows,
          features: hall.hall_features,
          status: hall.status,
          totalSeats: hall.total_seats,
          createdAt: hall.created_at ? Formatter.dateTime(hall.created_at) : "",
          updatedAt: hall.updated_at ? Formatter.dateTime(hall.updated_at) : "",
          createdBy: hall.created_by
            ? await userLoader.load(hall.created_by)
            : null,
          seats: hall.hall_id
            ? (await seatLoader.load(hall.hall_id)) || []
            : [],
          parts: hall.parts ? hall.parts : [],
        } as CinemaHall;
      }),
    );

    return {
      data,
      total,
    };
  }

  async createHall(input: CinemaHallInput) {
    const hall_id = v4();
    const total_seats = input.seats.length;

    const hallInput: table_cinema_hall = {
      hall_id,
      hall_name: input.name,
      hall_number: input.number,
      columns: input.columns,
      rows: input.rows,
      hall_features: input.features,
      status: input.status,
      total_seats,
      warehouse_id: this.user.currentWarehouseId || "",
      created_at: Formatter.getNowDateTime(),
      created_by: this.user.id || "",
      updated_at: Formatter.getNowDateTime(),
      deleted_at: null,
      parts: JSON.stringify(input.parts),
    };

    const seatInput: table_cinema_seat[] = input.seats.map((seat) => {
      return {
        seat_id: seat.id,
        hall_id,
        row_label: String.fromCharCode(64 + seat.row),
        seat_number: Number(seat.column),
        is_available: 1,
        seat_type: seat.type,
        created_at: Formatter.getNowDateTime(),
        updated_at: Formatter.getNowDateTime(),
        deleted_at: null,
        group_id: seat.groupId || null,
      };
    });

    const res = await this.tx.transaction(async (trx) => {
      await trx.table("cinema_hall").insert(hallInput);

      if (seatInput.length > 0) {
        await trx.table("cinema_seat").insert(seatInput);
      }
      return true;
    });

    return res;
  }

  async updateHall(id: string, input: CinemaHallInput) {
    if (!id) {
      return false;
    }

    const total_seats = input.seats.length;

    const hallInput = {
      hall_id: id,
      hall_name: input.name,
      hall_number: input.number,
      columns: input.columns,
      rows: input.rows,
      hall_features: JSON.stringify(input.features),
      status: input.status,
      total_seats,
      warehouse_id: this.user.currentWarehouseId || "",
      updated_at: Formatter.getNowDateTime(),
      deleted_at: null,
      parts: JSON.stringify(input.parts),
    };

    const seatInput = input.seats.map((seat) => {
      return {
        seat_id: seat.id,
        hall_id: id,
        row_label: String.fromCharCode(64 + seat.row),
        seat_number: Number(seat.column),
        is_available: 1,
        seat_type: seat.type,
        created_at: Formatter.getNowDateTime(),
        updated_at: Formatter.getNowDateTime(),
        deleted_at: null,
        group_id: seat.groupId || null,
      };
    });

    const { hall_id: hallIdCheck, ...restHallInsert } = hallInput;

    return await this.tx.transaction(async (trx) => {
      await trx
        .table("cinema_hall")
        .where("hall_id", hallIdCheck)
        .update(restHallInsert);

      if (seatInput.length > 0) {
        // delete existing seats
        await trx
          .table("cinema_seat")
          .whereIn(
            "hall_id",
            seatInput.map((s) => s.hall_id),
          )
          .delete();

        // insert new seats
        await trx.table("cinema_seat").insert(seatInput);
      }
      return true;
    });
  }

  async deleteHall(id: string) {
    const now = Formatter.getNowDateTime();

    return await this.tx.table("cinema_hall").where("hall_id", id).update({
      deleted_at: now,
    });
  }
}
