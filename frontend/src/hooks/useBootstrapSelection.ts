import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listOperators } from "@/api/operatorApi";
import { listMachines } from "@/api/machineApi";
import { listTrucks } from "@/api/truckApi";
import { queryKeys } from "@/lib/queryKeys";
import { useAppState } from "@/contexts/AppStateContext";

/**
 * On first load (no stored selection yet), auto-selects the first available
 * operator/machine/truck so the dashboard is immediately populated instead
 * of showing an empty "select an operator" screen. The operator can always
 * change the selection later in Settings.
 */
export function useBootstrapSelection() {
  const {
    selectedOperatorId,
    selectedMachineId,
    selectedTruckId,
    setSelectedOperatorId,
    setSelectedMachineId,
    setSelectedTruckId,
  } = useAppState();

  const operatorsQuery = useQuery({
    queryKey: queryKeys.operators(1),
    queryFn: ({ signal }) => listOperators({ page: 1, page_size: 50 }, signal),
    staleTime: 5 * 60_000,
  });
  const machinesQuery = useQuery({
    queryKey: queryKeys.machines(1),
    queryFn: ({ signal }) => listMachines({ page: 1, page_size: 50 }, signal),
    staleTime: 5 * 60_000,
  });
  const trucksQuery = useQuery({
    queryKey: queryKeys.trucks(1),
    queryFn: ({ signal }) => listTrucks({ page: 1, page_size: 50 }, signal),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!selectedOperatorId && operatorsQuery.data?.items.length) {
      setSelectedOperatorId(operatorsQuery.data.items[0].id);
    }
  }, [selectedOperatorId, operatorsQuery.data, setSelectedOperatorId]);

  useEffect(() => {
    if (!selectedMachineId && machinesQuery.data?.items.length) {
      setSelectedMachineId(machinesQuery.data.items[0].id);
    }
  }, [selectedMachineId, machinesQuery.data, setSelectedMachineId]);

  useEffect(() => {
    if (!selectedTruckId && trucksQuery.data?.items.length) {
      setSelectedTruckId(trucksQuery.data.items[0].id);
    }
  }, [selectedTruckId, trucksQuery.data, setSelectedTruckId]);

  return { operatorsQuery, machinesQuery, trucksQuery };
}
