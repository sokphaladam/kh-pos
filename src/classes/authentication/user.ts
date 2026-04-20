import bcrypt from "bcryptjs";
import { Knex } from "knex";

export class AuthenticationUser {
  private knex: Knex;
  constructor(knex: Knex) {
    this.knex = knex;
  }

  async findByUsername(username: string) {
    return this.knex("user").where({ username }).first();
  }

  async validatePassword(username: string, password: string) {
    const user = await this.findByUsername(username);
    if (!user) {
      return undefined;
    }
    const result = await bcrypt.compare(password, user.password);
    if (!result) return undefined;

    return user.token;
  }

  async changePassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.knex("user")
      .where({ id: userId })
      .update({ password: hashedPassword });
    return true;
  }
}
