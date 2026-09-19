import { useState } from 'react';

interface DishDraft {
  name: string;
  category: string;
  price: number;
  available: boolean;
}

export const AddDishModal = ({
  categories,
  onClose,
  onSubmit,
}: {
  categories: string[];
  onClose: () => void;
  onSubmit: (dish: DishDraft) => void;
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] ?? 'Coffee');
  const [price, setPrice] = useState('');
  const [available, setAvailable] = useState(true);

  const canSubmit = name.trim().length > 0 && Number(price) > 0;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form
        className="modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;
          onSubmit({ name: name.trim(), category, price: Number(price), available });
        }}
      >
        <h3 className="section-title" style={{ marginBottom: 0 }}>
          Add New Dish
        </h3>

        <label className="field">
          Dish name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Flat White" />
        </label>

        <label className="field">
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Price (₹)
          <input
            type="number"
            min="0"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="180"
          />
        </label>

        <label className="row" style={{ fontSize: 14 }}>
          <input
            type="checkbox"
            checked={available}
            onChange={(event) => setAvailable(event.target.checked)}
          />
          Available for ordering
        </label>

        <div className="row">
          <div className="spacer" />
          <button className="btn btn-outline" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
            Add Dish
          </button>
        </div>
      </form>
    </div>
  );
};
