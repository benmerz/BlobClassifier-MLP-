# BlobClassifier-MLP-

Frontend prototype for visualizing synthetic classification datasets that will later be used to train / inspect an MLP decision boundary.

## Datasets

- Quadrant Blobs (4-class): Four Gaussian clusters in each quadrant; slider increases spread and reduces separation.
- Moon (2-class): Two moons whose vertical & horizontal gap shrinks with higher noise; at high noise they overlap substantially.
- Diagonal Corner Clusters (3-class): Four corner clusters: two opposite corners share class 0 (diagonal), remaining corners are class 1 and class 2. Noise increases spread and slightly reduces corner separation.

## Training & Boundary

Enter epochs and learning rate then click "Train MLP" to fit a simple 2-layer neural network (ReLU + softmax) on the current dataset. After each epoch:

- Background is colored by predicted class (semi-transparent fill).
- White boundary lines show transitions between predicted regions.
- Misclassified points gain a white ring outline.
- Status line reports epoch and accuracy.

Resolution of the boundary grid is fixed (120x120) for performance.

### Controls

- Epochs: Number of full-batch passes over data.
- LR: Learning rate for gradient descent.
- Hidden: Comma-separated hidden layer sizes (e.g. `32,16` or `64,64,32`). Empty or invalid entries fallback to `16,16`.
- Train MLP: Starts training with current dataset & noise settings.
- Stop / Reset: Cancels training immediately, clears model & predictions, removes decision boundary.
- Overlap / Noise: Adjusts dataset randomness and overlap (affects all datasets differently).
- Moon Gap: Visible only for Moon dataset. Controls vertical separation between the two moons (0 => heavy overlap, 0.5 => wider apart). Actual effective gap shrinks slightly with higher noise for dynamic interaction.

## Usage

Open `index.html` in a browser (no build step required). Use the dropdown to select a dataset, adjust the point count, and press Regenerate.

Use the Overlap / Noise slider to:
- Increase Gaussian spread and reduce separation for Quadrant Blobs.
- Add radial/jitter noise to the Moon dataset.
- Increase diagonal stripe fuzziness for the 3-class stripes.
Higher values create more overlap between classes.

## Files

- `index.html` – Main page, controls and canvas.
- `style.css` – Basic dark theme styling.
- `script.js` – Dataset generators + drawing logic.

## Next Steps (Future)

- Integrate an in-browser MLP (TensorFlow.js or custom) to train on the current dataset.
- Visualize decision boundary heatmap behind points.
- Add parameter controls: learning rate, epochs, hidden layers.
- Allow seeding / reproducibility and exporting datasets.

## License

No license specified yet.