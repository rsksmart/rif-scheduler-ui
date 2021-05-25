import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Layout from "../shared/Layout";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import AddEditContract from "./AddEditContract";
import useContracts, { IContract } from "./useContracts";
import { useState } from "react";
import { CardActionArea } from "@material-ui/core";
import StoragePersistAlert from "./StoragePersistAlert";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      width: "100%",
      maxWidth: 800,
    },
  })
);

const Contracts = () => {
  const classes = useStyles();

  const contracts = useContracts((state) => state.contracts);

  const [editing, setEditing] = useState<IContract | null>(null);

  return (
    <Layout>
      <Card className={classes.root} variant="outlined">
        <CardHeader action={<AddEditContract />} title="Contracts" />
        <CardContent>
          <Typography variant="body2" color="textSecondary" component="p">
            Register your contract's here to be able to schedule its execution
            later.
          </Typography>
        </CardContent>
      </Card>

      <StoragePersistAlert />

      <AddEditContract
        key={`edit-contract-${editing?.id}`}
        hideButton={true}
        initialFields={editing}
        onClose={() => setEditing(null)}
      />

      <div
        className={classes.root}
        style={{
          marginTop: 15,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, 250px)",
          gridAutoRows: "180px",
          gridGap: "20px",
          justifyContent: "space-between",
        }}
      >
        {Object.entries(contracts).map(([id, contract]) => (
          <ContractButton
            key={`contract-list-${id}`}
            name={contract.name}
            network={contract.network}
            onClick={() => setEditing(contract)}
          />
        ))}
      </div>
    </Layout>
  );
};

const ContractButton = ({ name, network, onClick }: any) => {
  return (
    <Card>
      <CardActionArea
        style={{
          height: "100%",
          background: "url(/contract-bolt.svg) no-repeat",
          backgroundPosition: "right -60px top -20px",
          backgroundSize: "160px 160px",
        }}
        onClick={onClick}
      >
        <CardContent>
          <Typography gutterBottom variant="h5" component="h2">
            {name}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="span">
            {network}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default Contracts;
