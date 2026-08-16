import { getSyntheticDatasets } from "@/actions/admin";
import { SyntheticControls } from "./synthetic-controls";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SyntheticDataPage() {
  const datasets = await getSyntheticDatasets();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Synthetic Data Generation</h1>
        <p className="text-muted-foreground mt-2">
          Create demonstration datasets with distinct financial behaviours to showcase the scoring model.
        </p>
      </div>

      <SyntheticControls />

      <Card>
        <CardHeader>
          <CardTitle>Generated Datasets</CardTitle>
          <CardDescription>
            History of synthetic data generated for the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {datasets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No synthetic datasets have been generated yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preset</TableHead>
                  <TableHead>Profile ID</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => (
                  <TableRow key={dataset.id}>
                    <TableCell className="font-medium capitalize">
                      {dataset.preset.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {dataset.profileId}
                    </TableCell>
                    <TableCell>{dataset.recordCount}</TableCell>
                    <TableCell>{format(dataset.createdAt, "MMM d, yyyy HH:mm")}</TableCell>
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
