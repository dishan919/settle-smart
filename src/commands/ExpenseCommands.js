export class AddExpenseCommand {
  constructor(service, data) {
    this.service = service;
    this.data = data;
  }
  async execute() {
    this.id = await this.service.writeExpense(this.data);
    return this.id;
  }
  undo() {
    return this.service.removeExpense(this.id);
  }
}
export class UpdateExpenseCommand {
  constructor(service, id, data) {
    this.service = service;
    this.id = id;
    this.data = data;
  }
  async execute() {
    this.before = await this.service.expenses.get(this.id);
    if (!this.before) throw new Error('Expense no longer exists.');
    return this.service.writeExpense(this.data, this.id);
  }
  undo() {
    return this.service.writeExpense(
      {
        ...this.before,
        participantIds: this.before.participants.map((p) => p.memberId),
      },
      this.id,
    );
  }
}
export class DeleteExpenseCommand {
  constructor(service, id) {
    this.service = service;
    this.id = id;
  }
  async execute() {
    this.before = await this.service.expenses.get(this.id);
    if (!this.before) throw new Error('Expense no longer exists.');
    return this.service.removeExpense(this.id);
  }
  undo() {
    return this.service.writeExpense({
      ...this.before,
      participantIds: this.before.participants.map((p) => p.memberId),
    });
  }
}
